'use strict';

var docs_hbs            = require('../hbs/documentation.hbs')
var samples             = require('../../test/fixtures/samples')
var Program             = require('../../lib/program')
var Renderer            = require('./renderer')
var InstructionRenderer = require('./instruction-renderer')
var xtend               = require('xtend')
var asmEditor           = require('./asm-editor')()
var byteEditor          = require('./byte-editor')()

var ENTRY_POINT = 0x100

var defaultDocs = {
    heading: 'Help and Instruction Details'
  , text: 'Click on elements (like flags) to show details here.'
}

var initialState = {
    entryPoint: ENTRY_POINT
  , regs: {
      eax: 0x0
    , ecx: 0x0
    , edx: 0x0
    , ebx: 0x0
    , esp: 0x0
    , ebp: 0x0
    , esi: 0x0
    , edi: 0x0
    , eip: ENTRY_POINT
    , eflags: 0x202
  }
}

function clear() {
  // TODO: stop animations
  var docsEl = document.getElementById('docs')
  docsEl.innerHTML = docs_hbs(defaultDocs)
}

function initProgram() {
  return new Program({
      memSize    : initialState.regs.esp
    , entryPoint : initialState.entryPoint
    , text       : samples.mix_01
    , regs       : initialState.regs
  });
}

function initRenderer(program) {
  return new Renderer(program._currentCPUState());
}

var docsEl = document.getElementById('docs')
function initDocs(renderer) {
  docsEl.innerHTML = docs_hbs(defaultDocs)
  function renderDocs(docs) {
    docsEl.innerHTML = docs_hbs(docs)
  }
  renderer.ondocsRequested = renderDocs;
}

var program = initProgram()
var renderer = initRenderer(program)
initDocs(renderer)

var instructionRenderer = new InstructionRenderer(docsEl)

function step(fwd) {
  var state;
  if (fwd) {
    state = program.step();
  } else {
    state = program.stepBack();
  }
  clear();
  renderer.update(state)
  asmEditor.highlightInstruction(state.regs.eip);

  var meta = program.peek().instructionMeta;
  if (meta) instructionRenderer.render(xtend(meta));
}


function stepFwd() {
  step(true);
}

function stepBwd() {
  step(false);
}

function onstep(pos, fwd) {
  var currentStep = program.currentStep();
  if (currentStep === pos) return;

  if (typeof fwd === 'undefined') fwd = currentStep < pos;

  step(fwd);
  onstep(pos, fwd)
}

asmEditor.init(samples.mix_01, ENTRY_POINT, onstep);
byteEditor.init(samples.mix_01);
