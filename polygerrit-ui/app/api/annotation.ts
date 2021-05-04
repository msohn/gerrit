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
import {CoverageRange, Side} from './diff';

/**
 * This is the callback object that Gerrit calls once for each diff. Gerrit
 * is then responsible for styling the diff according the returned array of
 * CoverageRanges.
 */
export type CoverageProvider = (
  changeNum: number,
  path: string,
  basePatchNum?: number,
  patchNum?: number,
  /**
   * This is a ChangeInfo object as defined here:
   * https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html#change-info
   * At the moment we neither want to repeat it nor add a dependency on it here.
   * TODO: Create a dedicated smaller object for exposing a change in the plugin
   * API. Or allow the plugin API to depend on the entire rest API.
   */
  change?: unknown
) => Promise<Array<CoverageRange>>;

export declare interface AnnotationPluginApi {
  /**
   * The specified function will be called when a gr-diff component is built,
   * and feeds the returned coverage data into the diff. Optional.
   *
   * Be sure to call this only once and only from one plugin. Multiple coverage
   * providers are not supported. A second call will just overwrite the
   * provider of the first call.
   */
  setCoverageProvider(coverageProvider: CoverageProvider): AnnotationPluginApi;

  /**
   * For plugins notifying Gerrit about new annotations being ready to be
   * applied for a certain range. Gerrit will then re-render the relevant lines
   * of the diff and call back to the layer annotation function that was
   * registered in addLayer().
   *
   * @param path The file path whose listeners should be notified.
   * @param start The line where the update starts.
   * @param end The line where the update ends.
   * @param side The side of the update ('left' or 'right').
   */
  notify(path: string, start: number, end: number, side: Side): void;
}
