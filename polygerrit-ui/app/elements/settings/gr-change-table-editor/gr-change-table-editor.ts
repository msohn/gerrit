/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
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
import '../../shared/gr-button/gr-button';
import '../../../styles/shared-styles';
import '../../../styles/gr-form-styles';
import {dom, EventApi} from '@polymer/polymer/lib/legacy/polymer.dom';
import {PolymerElement} from '@polymer/polymer/polymer-element';
import {htmlTemplate} from './gr-change-table-editor_html';
import {ChangeTableMixin} from '../../../mixins/gr-change-table-mixin/gr-change-table-mixin';
import {customElement, property, observe} from '@polymer/decorators';
import {ServerInfo} from '../../../types/common';
import {appContext} from '../../../services/app-context';

// This avoids JSC_DYNAMIC_EXTENDS_WITHOUT_JSDOC closure compiler error.
const base = ChangeTableMixin(PolymerElement);

@customElement('gr-change-table-editor')
export class GrChangeTableEditor extends base {
  static get template() {
    return htmlTemplate;
  }

  @property({type: Array, notify: true})
  displayedColumns: string[] = [];

  @property({type: Boolean, notify: true})
  showNumber?: boolean;

  @property({type: Object})
  serverConfig?: ServerInfo;

  @property({type: Array})
  defaultColumns: string[] = [];

  private readonly flagsService = appContext.flagsService;

  @observe('serverConfig')
  _configChanged(config: ServerInfo) {
    this.defaultColumns = this.getEnabledColumns(
      this.columnNames,
      config,
      this.flagsService.enabledExperiments
    );
    if (!this.displayedColumns) return;
    this.displayedColumns = this.displayedColumns.filter(column =>
      this.isColumnEnabled(column, config, this.flagsService.enabledExperiments)
    );
  }

  /**
   * Get the list of enabled column names from whichever checkboxes are
   * checked (excluding the number checkbox).
   */
  _getDisplayedColumns() {
    if (this.root === null) return [];
    return (
      Array.from(
        this.root.querySelectorAll(
          '.checkboxContainer input:not([name=number])'
        )
      ) as HTMLInputElement[]
    )
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.name);
  }

  /**
   * Handle a click on a checkbox container and relay the click to the checkbox it
   * contains.
   */
  _handleCheckboxContainerClick(e: MouseEvent) {
    if (e.target === null) return;
    const checkbox = (e.target as HTMLElement).querySelector('input');
    if (!checkbox) {
      return;
    }
    checkbox.click();
  }

  /**
   * Handle a click on the number checkbox and update the showNumber property
   * accordingly.
   */
  _handleNumberCheckboxClick(e: MouseEvent) {
    this.showNumber = (
      (dom(e) as EventApi).rootTarget as HTMLInputElement
    ).checked;
  }

  /**
   * Handle a click on a displayed column checkboxes (excluding number) and
   * update the displayedColumns property accordingly.
   */
  _handleTargetClick() {
    this.set('displayedColumns', this._getDisplayedColumns());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-change-table-editor': GrChangeTableEditor;
  }
}
