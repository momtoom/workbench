# Handoff — 캔버스에서 프로젝트 드로어가 열리면 에디터 스크롤이 죽는 버그

작성: 2026-08-06. 앞선 세션의 분석 결과이며 **수정은 아직 들어가지 않았습니다.**
회귀 스펙만 작성되어 있습니다: `scripts/gesture-tests/specs/drawer-scroll-lock-isolation.spec.mjs`

## 증상

Design 캔버스에서 프로젝트 페이지의 Drawer(예: TACTICS-002의 "도구 및 레이어")를
Alt+클릭으로 열면, **에디터 크롬 전체**(좌측 레이어 트리, 우측 Inspector)의
휠 스크롤이 멈춥니다. 드로어를 닫으면 복구됩니다.

컨테이너 자체는 멀쩡합니다 — `element.scrollTop`을 직접 대입하면 정상 이동합니다.
즉 스타일 잠금이 아니라 **휠 이벤트가 차단**되는 문제입니다.

## 근본 원인

프로젝트 모듈은 **Workbench 창(부모 realm)에서 실행**되지만, 렌더된 DOM은
**프리뷰 iframe 안**에 있습니다. 이 분리가 모달 스크롤 락의 가정을 깨뜨립니다.

vaul / Radix Dialog가 쓰는 `react-remove-scroll`은:

1. 모듈이 실행되는 realm의 `document`(= **Workbench 문서**)에 비패시브 wheel
   리스너를 겁니다.
2. 이벤트 타깃이 "락 노드(drawer content)의 후손"인지 검사하고, 아니면
   `preventDefault()`로 스크롤을 막습니다.
3. 그런데 락 노드는 **iframe 문서 안**에 있습니다. Workbench 문서의 어떤
   노드도 그 후손이 될 수 없으므로, **에디터에서 발생한 모든 휠 이벤트가
   전부 차단**됩니다.

## 수정 방향 (미착수)

핵심은 "락이 어느 document에 붙는가"를 프리뷰 경계와 맞추는 것입니다. 후보:

- **A. iframe realm에서 락 설치**: 프리뷰 런타임이 프로젝트 모듈에 iframe의
  `document`를 보게 하거나, Drawer/Dialog 마운트 시 락 대상 문서를 iframe으로
  지정. 가장 정석이지만 런타임 모듈 로딩 경로를 건드립니다.
- **B. 프리뷰 경계에서 락 무력화**: 캔버스가 iframe 내부에 모달이 열린 것을
  감지하면 Workbench 문서에 걸린 스크롤 락 리스너를 무시/해제. 국소적이지만
  대증요법입니다.
- **C. 프로젝트 계약으로 회피**: 드로어를 `modal={false}`로 두게 하는 방식.
  프로젝트 소스를 바꿔야 하므로 앱 버그를 프로젝트에 전가하는 셈 — 비권장.

착수 전 `docs/WORKBENCH-V1-AGENT-GUIDE.md`의 App Versus Project Boundary와
`workbench-core-triage` 스킬을 확인할 것.

## 재현 / 검증

```bash
node scripts/gesture-tests/run.mjs
```

스펙은 TACTICS-002를 픽스처로 씁니다. 흐름:

1. 드로어 트리거를 **일반 클릭**(= 에디터 선택)해서 레이어 트리 조상 행을 펼침
   → 리스트가 오버플로되게 만듦
2. 드로어 **닫힘** 상태에서 레이어 트리 위 휠 → 스크롤 이동 확인(기준선)
3. **Alt+클릭**(= 런타임 인터랙션)으로 드로어 열기
4. 드로어 **열림** 상태에서 휠 → **현재 여기서 실패**
5. "지도 복귀"로 닫은 뒤 다시 휠 → 복구 확인

주의: 캔버스에서 일반 클릭은 선택, Alt+클릭이 런타임 입력입니다. 합성
WheelEvent로는 재현되지 않으므로 실제 포인터 입력(`page.mouse.wheel`)이
필요합니다.

## 참고 사실

- 이 문제는 페이지의 `useState` 인터랙션 미동작과는 **무관**합니다. 후자는
  캔버스가 소스를 투영만 하기 때문이며, Design states 바인딩으로 별도 해결됨.
- 셀렉터: 레이어 리스트 `#wb-design-layer-list`, 드로어 콘텐츠
  `[data-slot="drawer-content"]`.

## 추가 분석 (2026-08-06, 후속 세션) — 여전히 미수정

앞선 분석을 확인했고, **B안을 문자 그대로 적용하면 안 되는 이유**를 새로 찾았습니다.
수정은 여전히 들어가지 않았습니다.

### 재현 확인

`node scripts/gesture-tests/run.mjs drawer-scroll-lock` → 4단계에서
`layer tree wheel-scrolls while the project drawer is open (moved 0px)`.
1~3단계 기준선은 통과하므로 스펙 자체는 건강합니다.

### 원인 확정 (라이브러리 소스)

`node_modules/react-remove-scroll/dist/es2015/SideEffect.js:139`

```js
document.addEventListener('wheel', shouldPrevent, nonPassive);
```

`shouldPrevent`는 `shouldPreventQueue`에 없는 이벤트에 대해 shard가 없으면
`shouldStop = !lastProps.current.noIsolation` → `preventDefault()`. 큐는 락
서브트리의 `onWheelCapture`로만 채워지므로 에디터 크롬 휠은 항상 취소됩니다.

### 수정 위치는 이미 소유권이 정의되어 있음

`src/features/workbench-shell/ui/SourceTreePreview.tsx`의
`installSourceTreePreviewGlobalPatches()`가 같은 전제("Project modules execute
in the Workbench window while their nodes live in the preview iframe")로 이미
`window.getSelection`과 `window.matchMedia`를 iframe realm으로 라우팅합니다.
스크롤 락은 같은 범주이므로 B안은 대증요법이 아니라 **기존 경계의 확장**입니다.

참고로 Workbench 자체 document 휠 리스너(같은 파일의
`ownerDocument.addEventListener('wheel', handleWheel, { passive: false })`)는
이미 프리뷰 스코프로 early-return하므로 이 버그와 무관합니다.

### B안을 그대로 적용하면 안 되는 이유 (신규)

**Workbench 자체 UI도 Radix를 쓰므로 같은 Workbench 문서에 정당한 스크롤 락을
겁니다.** 자기 모달은 자기 페이지를 잠가야 합니다. 따라서 "Workbench 문서의 락을
무력화"를 무조건 적용하면 **Workbench 자신의 모달 스크롤 락까지 죽습니다.**
판별자가 반드시 필요합니다.

### 판별자는 이벤트 시점이어야 함

`vite.config.ts`:

```js
const WORKBENCH_PROJECT_RUNTIME_NODE_MODULE_ROOTS = [resolve(WORKBENCH_ROOT, 'node_modules')];
```

프로젝트 런타임의 bare import가 **Workbench 자신의 `node_modules`로 해석**됩니다
(확인함). 프로젝트에 자체 `react-remove-scroll` 사본이 있어도 런타임은 이 경로를
씁니다. `resolve.dedupe`는 `react`/`react-dom`만 지정되어 있습니다.

> 미확인: 런타임에 실제로 **단일 인스턴스**를 공유하는지는 직접 확인하지
> 않았습니다. 착수 전 프리뷰에서 인스턴스 동일성을 먼저 검증할 것.

단일 인스턴스라면 **등록 시점 판별이 불가능**합니다. 다음 방법이 모두 무너집니다:

- 모듈 URL 스택 추적 — 두 락이 같은 모듈에서 등록되므로 구분 불가
- 인스턴스 분리 — dedupe 대상이 아니어도 런타임 해석 경로가 하나
- React 커밋 브래킷 — 드로어는 초기 마운트가 아니라 **이후 커밋**에서 열리므로
  포털 서브트리를 감싸는 브래킷이 그 시점에 걸리지 않음

따라서 판별자는 "지금 활성 락이 프리뷰 문서에 사는가, Workbench 문서에 사는가"를
**이벤트 시점에**, 그리고 `props.lockRef` 같은 라이브러리 내부 접근 없이 판정해야
합니다.

### 구체안 (B′)

판별 신호는 **Workbench가 이미 소유한 프리뷰 포털 루트**를 쓰면 라이브러리 셀렉터에
의존하지 않습니다. `SourceTreePreview.tsx`는 `previewPortalRoot`
(`SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR`로 프리뷰 문서에서 찾는 노드)를
`WorkbenchPortalScopeContext.Provider`로 내려주고, **프로젝트 오버레이는 이 루트로
portal됩니다.** 따라서:

> 프리뷰 소유 오버레이가 열려 있다 ⟺ `previewPortalRoot`에 엘리먼트 자식이 있다

이건 Workbench 자신의 상태이지 vaul/Radix의 DOM 규약이 아니므로 드리프트가 없습니다.

착수 순서:

1. 프리뷰 경계에서 "프리뷰 소유 오버레이 활성" 상태를 `previewPortalRoot`의 자식
   유무로 추적한다.
2. `installSourceTreePreviewGlobalPatches()`를 확장해, 프리뷰가 마운트된 동안
   **Workbench 문서**에 등록되는 non-passive `wheel`/`touchmove`/`touchstart`
   리스너를 감싼다. (기존 `getSelection`/`matchMedia`와 같은 설치/복원 수명주기를
   따르고 `restore()`에 원복을 넣는다.)
3. 래퍼 규칙: **프리뷰 소유 오버레이가 열려 있고** 이벤트 타깃이 프리뷰 호스트
   **바깥**(에디터 크롬)이면 원본 리스너를 호출하지 않는다. 그 외에는 그대로 위임.
4. 프리뷰 내부 타깃은 항상 위임하므로 드로어 자체의 스크롤 락은 그대로 동작한다.

Workbench 자체 모달이 안전한 이유: 그때는 `previewPortalRoot`가 비어 있으므로 조건이
거짓이 되어 원본 가드가 손대지 않은 채 실행된다.

알려진 트레이드오프: Workbench 모달과 프리뷰 드로어가 **동시에** 열려 있으면
에디터 크롬 휠이 통과한다. 좁은 경우이고, 필요하면 Workbench 자체 오버레이 카운트를
같이 추적해 조일 수 있다.

검증: `node scripts/gesture-tests/run.mjs drawer-scroll-lock`(4단계 통과)에 더해
**Workbench 자체 모달을 열고 에디터 크롬 휠이 잠기는지**를 반드시 함께 확인할 것.
후자가 이 수정의 진짜 회귀 지점이다.

### A안도 다시 견줄 것

위 사실(런타임이 Workbench `node_modules`를 씀)은 **A안의 정당성을 높입니다** —
realm 분리가 근본 원인이고, A는 이 부류 전체(`getSelection`/`matchMedia` 패치 포함)를
없앨 수 있습니다. B′ 착수 전에 A를 한 번 더 견주어 볼 것.

> **해결됨 (2026-08-06).** 아래 "절반만 수정됨" 절의 2번 누수(Radix가 Workbench
> `body`에 `pointer-events: none`을 건다)는 **실재하지 않았습니다.** 실제 원인은
> 1번 수정의 판별자가 포털 루트를 하나만 봤다는 것입니다. 최종 결론은 맨 아래
> "해결 (2026-08-06)" 절을 보세요. 그 사이 절들은 분석 기록으로 남깁니다.

## 진행 상황 — 절반만 수정됨 (2026-08-06)

**realm 누수가 하나가 아니라 둘입니다.** 하나만 고쳤고, 그 절반이 이미 배포·패키징
되었습니다.

| # | 누수 | 상태 |
|---|---|---|
| 1 | `react-remove-scroll`이 Workbench `document`에 건 wheel 가드 → `preventDefault()` | **수정됨** (`c7ad185ec`) |
| 2 | Radix DismissableLayer가 Workbench `body`에 건 `pointer-events: none` | **미수정** |

### 1번 — 수정 완료

`installSourceTreePreviewGlobalPatches()`를 확장해, 프리뷰가 마운트된 동안 Workbench
문서에 등록되는 non-passive `wheel`/`touchmove`/`touchstart` 리스너를 래핑하고
프리뷰 소유 오버레이가 열려 있으면 원본을 호출하지 않습니다. 판별자는
`previewPortalRoot`의 자식 유무(위 "구체안" 참조). Workbench 자체 프리뷰 휠 브리지는
심볼 마커로 래핑에서 제외했습니다.

`npm run check` 통과. 로컬 dev 서버에서 **드로어 열린 상태로 레이어 트리 휠 스크롤
동작을 수동 확인**했습니다.

### 2번 — 미수정 (스펙이 계속 실패하는 진짜 이유)

`node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs`:

```js
originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
ownerDocument.body.style.pointerEvents = "none";                    // 열릴 때
ownerDocument.body.style.pointerEvents = originalBodyPointerEvents; // 닫힐 때
```

(vaul에도 닫을 때 `document.body.style.pointerEvents = 'auto'`로 되돌리는 코드가 있어
서로 맞물립니다.)

`ownerDocument`가 모듈 realm의 document, 즉 **Workbench 문서**입니다. 1번과 완전히
같은 realm 누수인데 증상 경로가 다릅니다 — 에디터 크롬 전체가 포인터 비활성이 되어
**휠 이벤트가 레이어 트리에 도달조차 하지 않습니다.** 스크롤 락과 무관하게 같은
증상이 납니다.

**따라서 스펙 실패는 스펙 결함이 아닙니다.** 스펙은 `page.mouse.move` →
`page.mouse.wheel`로 포인터 히트 테스트를 거치는 실제 입력을 쓰므로 2번에 그대로
걸립니다. 수동 조작에서 1번만 밟히는 경우가 있어 "고쳐진 것처럼" 보일 수 있으니,
**수동 확인을 통과 근거로 삼지 말 것.** 스펙 4단계 통과가 유일한 판정 기준입니다.

### 2번 착수 메모

판별자는 1번 것을 그대로 재사용합니다(`previewPortalRoot`에 자식이 있으면 프리뷰
소유 오버레이). 프리뷰 소유 오버레이가 열려 있는 동안 Workbench `body`의
`pointer-events: none`을 무력화하면 됩니다. Workbench 자체 모달은 포털 루트가 비어
있으므로 지금처럼 정상적으로 `none`이 걸립니다.

구현 방식 후보:

- **덜 침습적**: 프리뷰 오버레이가 열린 동안 Workbench 문서에
  `body { pointer-events: auto !important }` 규칙을 얹었다가 닫히면 제거. Radix의
  인라인 스타일 쓰기 자체는 건드리지 않으므로 닫힐 때의 원복 로직과 충돌하지 않음.
- **직접적**: `document.body.style`의 `pointerEvents` 쓰기를 가로채기.
  `CSSStyleDeclaration` 접근자를 건드려야 해서 위험이 큼. 권장하지 않음.

되돌릴 때 `installSourceTreePreviewGlobalPatches`의 `restore()`와 같은 수명주기를
따를 것.

### 이미 나간 것

1번만 담긴 상태로 Vercel 프로덕션 배포와 공증 DMG 재빌드가 완료되었습니다. 일렉트론은
렌더러를 Vercel에서 받으므로 앱 재시작만으로 1번이 반영됩니다. 2번을 고치면
**배포와 DMG 재빌드를 다시** 해야 합니다.

## 해결 (2026-08-06) — 스펙 통과

`node scripts/gesture-tests/run.mjs drawer-scroll-lock` → **PASS**.

### 2번 누수는 실재하지 않았습니다

위 분석은 `react-dismissable-layer`의 `ownerDocument.body.style.pointerEvents = "none"`
한 줄만 보고 `ownerDocument`를 모듈 realm의 document라고 단정했습니다. 같은 파일
41번 줄이 실제 바인딩입니다:

```js
const ownerDocument = node?.ownerDocument ?? globalThis?.document;
```

`node`는 레이어 DOM 노드이므로 `ownerDocument`는 **프리뷰 문서**입니다. Radix는
올바르게 동작하고 있었습니다. 드로어를 연 채 계측한 결과도 같습니다:

```
bodyInlinePointerEvents (Workbench):  (unset)
previewDocBodyPointerEvents:          none
```

`node`가 아직 없을 때만 `globalThis.document`로 폴백하는데, 그 경우 이펙트가
`if (!node) return;`으로 먼저 빠져나가므로 body에 쓰지 않습니다.

### 진짜 원인 — 1번 수정의 판별자가 포털 루트를 하나만 봤다

프리뷰 문서에는 포털 루트가 **둘** 있습니다:

| 셀렉터 | 용도 |
|---|---|
| `[data-workbench-portal-root="true"]` | 프레임 레벨. `SOURCE_TREE_PREVIEW_FRAME_HTML`의 정적 마크업 |
| `[data-workbench-theme-portal-root="true"]` | 테마 스코프 내부. 포털된 오버레이가 테마 토큰을 상속하도록 |

TACTICS-002처럼 페이지가 테마 스코프(`<main data-slot="theme">`)를 두면 프로젝트의
`useWorkbenchPortalContainer()`가 **테마 포털 루트**로 해석됩니다. 드로어 콘텐츠의
실제 조상 체인:

```
[data-slot="drawer-content"]
  └ <div data-workbench-theme-portal-root="true">
      └ <main data-slot="theme" data-theme="dark" ...>
```

`hasSourceTreePreviewOwnedOverlay()`는 프레임 레벨 루트만 봤으므로 드로어가 열려도
`firstElementChild`가 없어 **항상 false**였습니다. 즉 1번 수정의 래퍼는 이 픽스처에서
한 번도 발동하지 않았고, react-remove-scroll의 `preventDefault()`가 그대로 살아
있었습니다. 계측:

```
드로어 열림 / 수정 전:  portalRootChildren: 0,  themePortalRootCounts: 2
                        wheel {atWindow: 4, preventedAtWindow: 4} → 0px
드로어 열림 / 수정 후:  wheel {atWindow: 4, preventedAtWindow: 0} → 960px
```

주의: `preventDefault` 여부를 **캡처** 리스너에서 읽으면 안 됩니다.
react-remove-scroll의 가드는 `document`의 **버블** 리스너라서 캡처 시점에는
`defaultPrevented`가 항상 false입니다. 버블 경로 마지막인 `window`에서 읽어야
합니다. 앞선 세션이 "락과 무관한 증상"이라고 판단한 것도 이 착시였을 수 있습니다.

### 수정 내용

`hasSourceTreePreviewOwnedOverlay()`가 두 포털 루트를 모두 검사합니다
(`querySelectorAll` + `firstElementChild`). 한 줄 성격의 변경이고 1번 수정의 래퍼
구조는 그대로입니다. `pointer-events` 관련 코드는 추가하지 않았습니다 — 고칠 누수가
없습니다.

### Workbench 자체 모달 회귀 — 구조적으로 안전

판별자는 **프리뷰 문서만** 조회합니다. 계측 결과 Workbench 문서에는 이 두 셀렉터에
해당하는 노드가 **0개**이므로(`workbenchDocPortalRoots: 0`), Workbench 자신의
오버레이는 판별자를 만족시킬 수 없습니다. 드로어가 닫힌 상태에서 테마 포털 루트
자식 수도 0이므로(위 계측) 판별자가 상시 참으로 굳는 일도 없습니다. 자체 모달이
에디터 크롬 스크롤을 잠그는 동작은 그대로입니다.

여전히 남는 알려진 트레이드오프는 1번과 동일합니다: Workbench 모달과 프리뷰
오버레이가 **동시에** 열리면 에디터 크롬 휠이 통과합니다.

### 회귀 검증

- `npm run check` 통과.
- 전체 제스처 스위트 실행: `drawer-scroll-lock-isolation` PASS.
- 실패한 5개(`css-class-effectiveness-inspector`, `mobile-nav-trigger`,
  `palette-data-boundary`, `reorder-direction-matrix`, `snap-wheel-momentum`)는
  이 수정을 stash한 베이스라인에서도 **동일하게 실패**합니다. 이 변경과 무관하며,
  뒤 셋은 스펙 파일 자체가 워킹트리에서 수정 중입니다.

### 남은 일

Vercel 프로덕션 배포와 공증 DMG 재빌드를 다시 해야 합니다(1번만 담긴 채로 나가
있음).
