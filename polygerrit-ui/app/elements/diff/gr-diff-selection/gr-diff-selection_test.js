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
import '../../../test/common-test-setup-karma.js';
import './gr-diff-selection.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

// Splitting long lines in html into shorter rows breaks tests:
// zero-length text nodes and new lines are not expected in some places
/* eslint-disable max-len */
const basicFixture = fixtureFromTemplate(html`
<gr-diff-selection>
      <table id="diffTable" class="side-by-side">
        <tr class="diff-row">
          <td class="blame" data-line-number="1"></td>
          <td class="lineNum left" data-value="1">1</td>
          <td class="content">
            <div class="contentText" data-side="left">ba ba</div>
            <div data-side="left">
              <div class="comment-thread">
                <div class="gr-formatted-text message">
                  <span id="output" class="gr-linked-text">This is a comment</span>
                </div>
              </div>
            </div>
          </td>
          <td class="lineNum right" data-value="1">1</td>
          <td class="content">
            <div class="contentText" data-side="right">some other text</div>
          </td>
        </tr>
        <tr class="diff-row">
          <td class="blame" data-line-number="2"></td>
          <td class="lineNum left" data-value="2">2</td>
          <td class="content">
            <div class="contentText" data-side="left">zin</div>
          </td>
          <td class="lineNum right" data-value="2">2</td>
          <td class="content">
            <div class="contentText" data-side="right">more more more</div>
            <div data-side="right">
              <div class="comment-thread">
                <div class="gr-formatted-text message">
                  <span id="output" class="gr-linked-text">This is a comment on the right</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
        <tr class="diff-row">
          <td class="blame" data-line-number="3"></td>
          <td class="lineNum left" data-value="3">3</td>
          <td class="content">
            <div class="contentText" data-side="left">ga ga</div>
            <div data-side="left">
              <div class="comment-thread">
                <div class="gr-formatted-text message">
                  <span id="output" class="gr-linked-text">This is <a>a</a> different comment 💩 unicode is fun</span>
                </div>
              </div>
            </div>
          </td>
          <td class="lineNum right" data-value="3">3</td>
        </tr>
        <tr class="diff-row">
          <td class="blame" data-line-number="4"></td>
          <td class="lineNum left" data-value="4">4</td>
          <td class="content">
            <div class="contentText" data-side="left">ga ga</div>
            <div data-side="left">
              <div class="comment-thread">
                <textarea data-side="right">test for textarea copying</textarea>
              </div>
            </div>
          </td>
          <td class="lineNum right" data-value="4">4</td>
        </tr>
        <tr class="not-diff-row">
          <td class="other">
            <div class="contentText" data-side="right">some other text</div>
          </td>
        </tr>
      </table>
    </gr-diff-selection>
`);
/* eslint-enable max-len */

suite('gr-diff-selection', () => {
  let element;

  const emulateCopyOn = function(target) {
    const fakeEvent = {
      target,
      preventDefault: sinon.stub(),
      clipboardData: {
        setData: sinon.stub(),
      },
    };
    element._getCopyEventTarget.returns(target);
    element._handleCopy(fakeEvent);
    return fakeEvent;
  };

  setup(() => {
    element = basicFixture.instantiate();

    sinon.stub(element, '_getCopyEventTarget');
    element._cachedDiffBuilder = {
      getLineElByChild: sinon.stub().returns({}),
      getSideByLineEl: sinon.stub(),
      diffElement: element.querySelector('#diffTable'),
    };
    element.diff = {
      content: [
        {
          a: ['ba ba'],
          b: ['some other text'],
        },
        {
          a: ['zin'],
          b: ['more more more'],
        },
        {
          a: ['ga ga'],
          b: ['some other text'],
        },
      ],
    };
  });

  test('applies selected-left on left side click', () => {
    element.classList.add('selected-right');
    const lineNumberEl = element.querySelector('.lineNum.left');
    MockInteractions.down(lineNumberEl);
    assert.isTrue(
        element.classList.contains('selected-left'), 'adds selected-left');
    assert.isFalse(
        element.classList.contains('selected-right'),
        'removes selected-right');
  });

  test('applies selected-right on right side click', () => {
    element.classList.add('selected-left');
    const lineNumberEl = element.querySelector('.lineNum.right');
    MockInteractions.down(lineNumberEl);
    assert.isTrue(
        element.classList.contains('selected-right'), 'adds selected-right');
    assert.isFalse(
        element.classList.contains('selected-left'), 'removes selected-left');
  });

  test('applies selected-blame on blame click', () => {
    element.classList.add('selected-left');
    element.diffBuilder.getLineElByChild.returns(null);
    sinon.stub(element, '_elementDescendedFromClass').callsFake(
        (el, className) => className === 'blame');
    MockInteractions.down(element);
    assert.isTrue(
        element.classList.contains('selected-blame'), 'adds selected-right');
    assert.isFalse(
        element.classList.contains('selected-left'), 'removes selected-left');
  });

  test('ignores copy for non-content Element', () => {
    sinon.stub(element, '_getSelectedText');
    emulateCopyOn(element.querySelector('.not-diff-row'));
    assert.isFalse(element._getSelectedText.called);
  });

  test('asks for text for left side Elements', () => {
    element._cachedDiffBuilder.getSideByLineEl.returns('left');
    sinon.stub(element, '_getSelectedText');
    emulateCopyOn(element.querySelector('div.contentText'));
    assert.deepEqual(['left', false], element._getSelectedText.lastCall.args);
  });

  test('reacts to copy for content Elements', () => {
    sinon.stub(element, '_getSelectedText');
    emulateCopyOn(element.querySelector('div.contentText'));
    assert.isTrue(element._getSelectedText.called);
  });

  test('copy event is prevented for content Elements', () => {
    sinon.stub(element, '_getSelectedText');
    element._cachedDiffBuilder.getSideByLineEl.returns('left');
    element._getSelectedText.returns('test');
    const event = emulateCopyOn(element.querySelector('div.contentText'));
    assert.isTrue(event.preventDefault.called);
  });

  test('inserts text into clipboard on copy', () => {
    sinon.stub(element, '_getSelectedText').returns('the text');
    const event = emulateCopyOn(element.querySelector('div.contentText'));
    assert.deepEqual(
        ['Text', 'the text'], event.clipboardData.setData.lastCall.args);
  });

  test('_setClasses adds given SelectionClass values, removes others', () => {
    element.classList.add('selected-right');
    element._setClasses(['selected-comment', 'selected-left']);
    assert.isTrue(element.classList.contains('selected-comment'));
    assert.isTrue(element.classList.contains('selected-left'));
    assert.isFalse(element.classList.contains('selected-right'));
    assert.isFalse(element.classList.contains('selected-blame'));

    element._setClasses(['selected-blame']);
    assert.isFalse(element.classList.contains('selected-comment'));
    assert.isFalse(element.classList.contains('selected-left'));
    assert.isFalse(element.classList.contains('selected-right'));
    assert.isTrue(element.classList.contains('selected-blame'));
  });

  test('_setClasses removes before it ads', () => {
    element.classList.add('selected-right');
    const addStub = sinon.stub(element.classList, 'add');
    const removeStub = sinon.stub(element.classList, 'remove').callsFake(
        () => {
          assert.isFalse(addStub.called);
        });
    element._setClasses(['selected-comment', 'selected-left']);
    assert.isTrue(addStub.called);
    assert.isTrue(removeStub.called);
  });

  test('copies content correctly', () => {
    // Fetch the line number.
    element._cachedDiffBuilder.getLineElByChild = function(child) {
      while (!child.classList.contains('content') && child.parentElement) {
        child = child.parentElement;
      }
      return child.previousElementSibling;
    };

    element.classList.add('selected-left');
    element.classList.remove('selected-right');

    const selection = document.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStart(element.querySelector('div.contentText').firstChild, 3);
    range.setEnd(
        element.querySelectorAll('div.contentText')[4].firstChild, 2);
    selection.addRange(range);
    assert.equal(element._getSelectedText('left'), 'ba\nzin\nga');
  });

  test('copies comments', () => {
    element.classList.add('selected-left');
    element.classList.add('selected-comment');
    element.classList.remove('selected-right');
    const selection = document.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStart(
        element.querySelector('.gr-formatted-text *').firstChild, 3);
    range.setEnd(
        element.querySelectorAll('.gr-formatted-text *')[2].childNodes[2], 7);
    selection.addRange(range);
    assert.equal('s is a comment\nThis is a differ',
        element._getSelectedText('left', true));
  });

  test('respects astral chars in comments', () => {
    element.classList.add('selected-left');
    element.classList.add('selected-comment');
    element.classList.remove('selected-right');
    const selection = document.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    const nodes = element.querySelectorAll('.gr-formatted-text *');
    range.setStart(nodes[2].childNodes[2], 13);
    range.setEnd(nodes[2].childNodes[2], 23);
    selection.addRange(range);
    assert.equal('mment 💩 u',
        element._getSelectedText('left', true));
  });

  test('defers to default behavior for textarea', () => {
    element.classList.add('selected-left');
    element.classList.remove('selected-right');
    const selectedTextSpy = sinon.spy(element, '_getSelectedText');
    emulateCopyOn(element.querySelector('textarea'));
    assert.isFalse(selectedTextSpy.called);
  });

  test('regression test for 4794', () => {
    element._cachedDiffBuilder.getLineElByChild = function(child) {
      while (!child.classList.contains('content') && child.parentElement) {
        child = child.parentElement;
      }
      return child.previousElementSibling;
    };

    element.classList.add('selected-right');
    element.classList.remove('selected-left');

    const selection = document.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStart(
        element.querySelectorAll('div.contentText')[1].firstChild, 4);
    range.setEnd(
        element.querySelectorAll('div.contentText')[1].firstChild, 10);
    selection.addRange(range);
    assert.equal(element._getSelectedText('right'), ' other');
  });

  test('copies to end of side (issue 7895)', () => {
    element._cachedDiffBuilder.getLineElByChild = function(child) {
      // Return null for the end container.
      if (child.textContent === 'ga ga') { return null; }
      while (!child.classList.contains('content') && child.parentElement) {
        child = child.parentElement;
      }
      return child.previousElementSibling;
    };
    element.classList.add('selected-left');
    element.classList.remove('selected-right');
    const selection = document.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStart(element.querySelector('div.contentText').firstChild, 3);
    range.setEnd(
        element.querySelectorAll('div.contentText')[4].firstChild, 2);
    selection.addRange(range);
    assert.equal(element._getSelectedText('left'), 'ba\nzin\nga');
  });

  suite('_getTextContentForRange', () => {
    let selection;
    let range;
    let nodes;

    setup(() => {
      element.classList.add('selected-left');
      element.classList.add('selected-comment');
      element.classList.remove('selected-right');
      selection = document.getSelection();
      selection.removeAllRanges();
      range = document.createRange();
      nodes = element.querySelectorAll('.gr-formatted-text *');
    });

    test('multi level element contained in range', () => {
      range.setStart(nodes[2].childNodes[0], 1);
      range.setEnd(nodes[2].childNodes[2], 7);
      selection.addRange(range);
      assert.equal(element._getTextContentForRange(element, selection, range),
          'his is a differ');
    });

    test('multi level element as startContainer of range', () => {
      range.setStart(nodes[2].childNodes[1], 0);
      range.setEnd(nodes[2].childNodes[2], 7);
      selection.addRange(range);
      assert.equal(element._getTextContentForRange(element, selection, range),
          'a differ');
    });

    test('startContainer === endContainer', () => {
      range.setStart(nodes[0].firstChild, 2);
      range.setEnd(nodes[0].firstChild, 12);
      selection.addRange(range);
      assert.equal(element._getTextContentForRange(element, selection, range),
          'is is a co');
    });
  });

  test('cache is reset when diff changes', () => {
    element._linesCache = {left: 'test', right: 'test'};
    element.diff = {};
    flush();
    assert.deepEqual(element._linesCache, {left: null, right: null});
  });
});

