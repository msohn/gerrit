// Copyright (C) 2019 The Android Open Source Project
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

package com.google.gerrit.git;

import static com.google.common.base.Preconditions.checkArgument;
import static java.util.Objects.requireNonNull;

import java.io.IOException;
import org.eclipse.jgit.lib.AnyObjectId;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.ObjectReader;

/** Static utilities for working with {@code ObjectId}s. */
public class ObjectIds {
  /** Length of a hex SHA-1 string. */
  public static final int STR_LEN = Constants.OBJECT_ID_STRING_LENGTH;

  /** Default abbreviated length of a hex SHA-1 string. */
  public static final int ABBREV_STR_LEN = 7;

  /**
   * Abbreviate an ID's hex string representation to 7 chars.
   *
   * @param id object ID.
   * @return abbreviated hex string representation, exactly 7 chars.
   */
  public static String abbreviateName(AnyObjectId id) {
    return abbreviateName(id, ABBREV_STR_LEN);
  }

  /**
   * Abbreviate an ID's hex string representation to {@code n} chars.
   *
   * @param id object ID.
   * @param n number of hex chars, 1 to 40.
   * @return abbreviated hex string representation, exactly {@code n} chars.
   */
  public static String abbreviateName(AnyObjectId id, int n) {
    checkValidLength(n);
    return requireNonNull(id).abbreviate(n).name();
  }

  /**
   * Abbreviate an ID's hex string representation uniquely to at least 7 chars.
   *
   * @param id object ID.
   * @param reader object reader for determining uniqueness.
   * @return abbreviated hex string representation, unique according to {@code reader} at least 7
   *     chars.
   * @throws IOException if an error occurs while looking for ambiguous objects.
   */
  public static String abbreviateName(AnyObjectId id, ObjectReader reader) throws IOException {
    return abbreviateName(id, ABBREV_STR_LEN, reader);
  }

  /**
   * Abbreviate an ID's hex string representation uniquely to at least {@code n} chars.
   *
   * @param id object ID.
   * @param n minimum number of hex chars, 1 to 40.
   * @param reader object reader for determining uniqueness.
   * @return abbreviated hex string representation, unique according to {@code reader} at least
   *     {@code n} chars.
   * @throws IOException if an error occurs while looking for ambiguous objects.
   */
  public static String abbreviateName(AnyObjectId id, int n, ObjectReader reader)
      throws IOException {
    checkValidLength(n);
    return reader.abbreviate(id, n).name();
  }

  private static void checkValidLength(int n) {
    checkArgument(n > 0);
    checkArgument(n <= STR_LEN);
  }

  private ObjectIds() {}
}
