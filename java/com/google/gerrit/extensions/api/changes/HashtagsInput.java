// Copyright (C) 2014 The Android Open Source Project
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

package com.google.gerrit.extensions.api.changes;

import com.google.gerrit.extensions.restapi.DefaultInput;
import java.util.Set;

public class HashtagsInput {
  @DefaultInput public Set<String> add;
  public Set<String> remove;

  public HashtagsInput() {}

  public HashtagsInput(Set<String> add) {
    this.add = add;
  }

  public HashtagsInput(Set<String> add, Set<String> remove) {
    this(add);
    this.remove = remove;
  }
}
