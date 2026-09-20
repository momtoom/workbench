export function runSourceTreePreviewRuntimeLifecycleFixture(
  getProjectComponentProps,
  {
    getRuntimeRootNodeId,
    mergeProjectComponentProps,
  } = {},
) {
  const fixtureEvents = [];
  let componentRoot = null;
  let editorInstrumentationRoot = null;
  let resizeObserverRealm = null;

  class FixtureResizeObserver {
    constructor(callback) {
      resizeObserverRealm = fixtureWindow;
      this.callback = callback;
    }

    observe(target) {
      fixtureEvents.push(['resize-observe', target]);
      this.callback();
    }

    disconnect() {
      fixtureEvents.push(['resize-disconnect']);
    }
  }

  const fixtureWindow = {
    ResizeObserver: FixtureResizeObserver,
    devicePixelRatio: 2,
    requestAnimationFrame(callback) {
      fixtureEvents.push(['animation-frame']);
      callback(1);
      return 1;
    },
  };
  const fixtureDocument = { defaultView: fixtureWindow };
  const fixtureRoot = {
    dataset: {},
    ownerDocument: fixtureDocument,
  };
  const fixtureCanvas = {
    height: 150,
    ownerDocument: fixtureDocument,
    width: 300,
    getBoundingClientRect() {
      return { height: 180, width: 320 };
    },
  };
  const selectionHandler = () => {
    fixtureEvents.push(['selection']);
  };
  const sourceClickHandler = () => {
    fixtureEvents.push(['source-click']);
  };
  const editorInstrumentationRef = (node) => {
    editorInstrumentationRoot = node;
  };
  const internalComponentRef = (node) => {
    componentRoot = node;
  };

  const projectedProps = getProjectComponentProps({
    'data-wb-preview-node-id': 'runtime-lifecycle-fixture',
    draggable: false,
    onClick: selectionHandler,
    onDoubleClick: selectionHandler,
    onKeyDown: selectionHandler,
    onMouseDownCapture: selectionHandler,
    onPointerDown: selectionHandler,
    onPointerDownCapture: selectionHandler,
    ref: editorInstrumentationRef,
    role: 'button',
    tabIndex: 0,
  });

  if ('ref' in projectedProps) {
    throw new Error('Project runtime component props retained the editor instrumentation ref.');
  }
  if (
    'onClick' in projectedProps ||
    'onDoubleClick' in projectedProps ||
    'onKeyDown' in projectedProps ||
    'onMouseDownCapture' in projectedProps ||
    'onPointerDown' in projectedProps ||
    'onPointerDownCapture' in projectedProps ||
    'draggable' in projectedProps ||
    'role' in projectedProps ||
    'tabIndex' in projectedProps
  ) {
    throw new Error('Project runtime component props retained editor interaction instrumentation.');
  }

  // React 19 treats ref as an ordinary prop. This mirrors a project component
  // that owns its root ref but spreads Workbench runtime props after it.
  const renderedRootProps = {
    ...(mergeProjectComponentProps
      ? mergeProjectComponentProps(
          {
            className: 'fixture-component-root',
            onClick: sourceClickHandler,
          },
          projectedProps,
        )
      : projectedProps),
    ref: internalComponentRef,
  };
  renderedRootProps.ref(fixtureRoot);
  fixtureRoot.className = renderedRootProps.className ?? '';

  // This models the component effect used by text, particle, and ASCII canvas
  // components. Losing the internal root ref must prevent the fixture passing.
  if (!componentRoot) {
    throw new Error('The project component internal ref was replaced before its effect ran.');
  }
  const ownerWindow = componentRoot.ownerDocument.defaultView;
  const dpr = ownerWindow.devicePixelRatio;
  const rect = fixtureCanvas.getBoundingClientRect();
  fixtureCanvas.width = Math.round(rect.width * dpr);
  fixtureCanvas.height = Math.round(rect.height * dpr);
  componentRoot.dataset.effectState = 'ready';
  const observer = new ownerWindow.ResizeObserver(() => {
    fixtureEvents.push(['resize-effect']);
  });
  observer.observe(fixtureCanvas);
  ownerWindow.requestAnimationFrame(() => {
    fixtureEvents.push(['animation-effect']);
  });
  renderedRootProps.onClick();

  return {
    canvasBuffer: [fixtureCanvas.width, fixtureCanvas.height],
    dataPropsForwarded:
      projectedProps['data-wb-preview-node-id'] === 'runtime-lifecycle-fixture',
    editorRefIsolated: editorInstrumentationRoot === null,
    editorHandlersIsolated: !fixtureEvents.some(([event]) => event === 'selection'),
    effectRan: componentRoot.dataset.effectState === 'ready',
    internalRefPreserved: componentRoot === fixtureRoot,
    realmAnimationFrameUsed: fixtureEvents.some(([event]) => event === 'animation-frame'),
    realmResizeObserverUsed: resizeObserverRealm === fixtureWindow,
    runtimeRootMatched:
      typeof getRuntimeRootNodeId === 'function' &&
      getRuntimeRootNodeId(fixtureRoot.className) === 'runtime-lifecycle-fixture',
    sourceClassNamePreserved:
      fixtureRoot.className.split(/\s+/).includes('fixture-component-root'),
    sourceHandlerPreserved: fixtureEvents.some(([event]) => event === 'source-click'),
  };
}
