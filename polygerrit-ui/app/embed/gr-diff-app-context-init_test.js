/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../test/common-test-setup-karma.js';
import {getAppContext} from '../services/app-context.js';
import {
  initDiffAppContext,
} from './gr-diff-app-context-init.js';

suite('gr diff app context initializer tests', () => {
  setup(() => {
    initDiffAppContext();
  });

  test('all services initialized and are singletons', () => {
    const appContext = getAppContext();
    Object.keys(appContext).forEach(serviceName => {
      const service = appContext[serviceName];
      assert.isNotNull(service);
      const service2 = appContext[serviceName];
      assert.strictEqual(service, service2);
    });
  });
});

