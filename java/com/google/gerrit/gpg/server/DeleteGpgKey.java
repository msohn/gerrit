// Copyright (C) 2015 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.gpg.server;

import static com.google.gerrit.gpg.PublicKeyStore.keyIdToString;
import static com.google.gerrit.server.account.externalids.ExternalId.SCHEME_GPGKEY;

import com.google.common.collect.ImmutableList;
import com.google.common.flogger.FluentLogger;
import com.google.common.io.BaseEncoding;
import com.google.gerrit.exceptions.EmailException;
import com.google.gerrit.exceptions.StorageException;
import com.google.gerrit.extensions.common.Input;
import com.google.gerrit.extensions.restapi.ResourceNotFoundException;
import com.google.gerrit.extensions.restapi.Response;
import com.google.gerrit.extensions.restapi.RestApiException;
import com.google.gerrit.extensions.restapi.RestModifyView;
import com.google.gerrit.gpg.PublicKeyStore;
import com.google.gerrit.server.GerritPersonIdent;
import com.google.gerrit.server.UserInitiated;
import com.google.gerrit.server.account.AccountsUpdate;
import com.google.gerrit.server.account.externalids.ExternalId;
import com.google.gerrit.server.account.externalids.ExternalIdKeyFactory;
import com.google.gerrit.server.account.externalids.ExternalIds;
import com.google.gerrit.server.mail.send.DeleteKeySender;
import com.google.inject.Inject;
import com.google.inject.Provider;
import java.io.IOException;
import java.util.Optional;
import org.bouncycastle.openpgp.PGPException;
import org.bouncycastle.openpgp.PGPPublicKey;
import org.eclipse.jgit.errors.ConfigInvalidException;
import org.eclipse.jgit.lib.CommitBuilder;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.RefUpdate;

public class DeleteGpgKey implements RestModifyView<GpgKey, Input> {
  private static final FluentLogger logger = FluentLogger.forEnclosingClass();

  private final Provider<PersonIdent> serverIdent;
  private final Provider<PublicKeyStore> storeProvider;
  private final Provider<AccountsUpdate> accountsUpdateProvider;
  private final ExternalIds externalIds;
  private final DeleteKeySender.Factory deleteKeySenderFactory;
  private final ExternalIdKeyFactory externalIdKeyFactory;

  @Inject
  DeleteGpgKey(
      @GerritPersonIdent Provider<PersonIdent> serverIdent,
      Provider<PublicKeyStore> storeProvider,
      @UserInitiated Provider<AccountsUpdate> accountsUpdateProvider,
      ExternalIds externalIds,
      DeleteKeySender.Factory deleteKeySenderFactory,
      ExternalIdKeyFactory externalIdKeyFactory) {
    this.serverIdent = serverIdent;
    this.storeProvider = storeProvider;
    this.accountsUpdateProvider = accountsUpdateProvider;
    this.externalIds = externalIds;
    this.deleteKeySenderFactory = deleteKeySenderFactory;
    this.externalIdKeyFactory = externalIdKeyFactory;
  }

  @Override
  public Response<?> apply(GpgKey rsrc, Input input)
      throws RestApiException, PGPException, IOException, ConfigInvalidException {
    PGPPublicKey key = rsrc.getKeyRing().getPublicKey();
    String fingerprint = BaseEncoding.base16().encode(key.getFingerprint());
    Optional<ExternalId> extId =
        externalIds.get(externalIdKeyFactory.create(SCHEME_GPGKEY, fingerprint));
    if (!extId.isPresent()) {
      throw new ResourceNotFoundException(fingerprint);
    }

    accountsUpdateProvider
        .get()
        .update(
            "Delete GPG Key via API",
            rsrc.getUser().getAccountId(),
            u -> u.deleteExternalId(extId.get()));

    try (PublicKeyStore store = storeProvider.get()) {
      store.remove(rsrc.getKeyRing().getPublicKey().getFingerprint());

      CommitBuilder cb = new CommitBuilder();
      PersonIdent committer = serverIdent.get();
      cb.setAuthor(rsrc.getUser().newCommitterIdent(committer.getWhen(), committer.getTimeZone()));
      cb.setCommitter(committer);
      cb.setMessage("Delete public key " + keyIdToString(key.getKeyID()));

      RefUpdate.Result saveResult = store.save(cb);
      switch (saveResult) {
        case NO_CHANGE:
        case FAST_FORWARD:
          try {
            deleteKeySenderFactory
                .create(rsrc.getUser(), ImmutableList.of(PublicKeyStore.keyToString(key)))
                .send();
          } catch (EmailException e) {
            logger.atSevere().withCause(e).log(
                "Cannot send GPG key deletion message to %s",
                rsrc.getUser().getAccount().preferredEmail());
          }
          break;
        case LOCK_FAILURE:
        case FORCED:
        case IO_FAILURE:
        case NEW:
        case NOT_ATTEMPTED:
        case REJECTED:
        case REJECTED_CURRENT_BRANCH:
        case RENAMED:
        case REJECTED_MISSING_OBJECT:
        case REJECTED_OTHER_REASON:
        default:
          throw new StorageException(String.format("Failed to delete public key: %s", saveResult));
      }
    }
    return Response.none();
  }
}
