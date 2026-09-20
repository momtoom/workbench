# WORKBENCH-V1 편집 연산 모델

## 왜 이 문서가 필요한가

새로 만드는 것은 쉽다.
어려운 것은 변형이다.

Workbench가 진짜 편집기라면 다음을 모두 다뤄야 한다.

- 생성
- 쓰기
- 부분 수정
- 구조 수정
- 복사
- 붙여넣기
- 잘라내기
- 복제
- 이동 / 재정렬
- 삭제
- 복원
- undo / redo
- import / re-import
- 저장
- 다른 메뉴나 엔티티로 이동했다가 다시 돌아오기
- 삭제 후 같은 내용을 다시 만들기
- instance override

즉 V1의 핵심은 "무엇을 만들 수 있는가"보다 "변화를 어떻게 모델링하는가"다.

---

## 핵심 결론

**V1은 UI 이벤트 중심이 아니라 편집 연산 중심으로 설계되어야 한다.**

즉:

- 버튼 클릭
- 드래그
- 인스펙터 입력
- 단축키
- 파일 import
- 탭 / 메뉴 이동
- 자동 저장

이 먼저가 아니라, 그 뒤에 어떤 canonical edit operation이 발생했는지가 먼저다.

---

## 편집의 정의

V1에서 편집은 "편집 가능한 요소가 있다"는 뜻이 아니다.

편집은 사용자가 만든 최종 authoring 값을 잃지 않고 계속 변화시키는 전체 라이프사이클이다.

포함되는 케이스:

- 처음 값을 쓴다.
- 값을 지운다.
- 값을 수정한다.
- 같은 내용을 다시 쓴다.
- 선택한 내용을 복사한다.
- 복사한 내용을 붙여넣는다.
- 선택한 내용을 잘라내고 다른 위치에 붙인다.
- 기존 구조를 복제한다.
- 순서를 바꾼다.
- 저장한다.
- 다른 메뉴나 엔티티로 갔다가 돌아온다.
- undo / redo로 되돌리고 다시 적용한다.
- 외부 데이터를 import한다.
- import한 내용을 지운다.
- 다시 import한다.
- 지운 내용과 같은 내용을 새로 만든다.

따라서 Inspector 구현은 필드 입력 UI를 먼저 만드는 문제가 아니다.
Inspector는 이 라이프사이클 위에 올라오는 편집 표면이어야 한다.

---

## 이전 버전에서 확인된 근거

이전 버전은 완성된 설계는 아니지만, 왜 이 계약이 필요한지 보여주는 근거가 있다.

- `history.store.ts`는 코드만 저장하지 않고 document, tokens, tokenBindings, previewProps까지 함께 snapshot으로 저장했다.
- undo / redo 적용 중에는 history guard를 켜서 autosave가 방금 복원한 상태를 이전 tree로 덮어쓰지 못하게 막았다.
- `page-navigation.service.ts`는 탭이나 엔티티 전환 전에 현재 editor 값을 entity로 flush했다.
- 엔티티 전환 중에는 loading guard를 둬서 새 entity id에 이전 parsedTree가 저장되는 race를 막았다.
- `App.tsx` autosave는 프로젝트 복원 전 저장을 막고, local backup을 즉시 남긴 뒤 cloud 저장을 debounce했다.
- beforeunload에서는 비동기 cloud 저장에 의존하지 않고 현재 persisted state를 즉시 백업했다.
- 노드 duplicate, wrap, unwrap 같은 구조 편집은 tree 변경뿐 아니라 CSS block, selection, scroll 복원까지 같이 처리했다.

V1은 이 구현을 그대로 가져오지 않는다.
대신 이 문제들을 `EditOperationPipeline`의 명시적 단계로 승격한다.

---

## 최종값 보존 원칙

모든 편집 기능은 아래 원칙을 만족해야 한다.

1. 최종 authoring 값이 canonical이다.
2. preview, expanded tree, renderer payload, table filter 결과는 파생값이며 저장 기준이 아니다.
3. 저장은 편집 연산이 아니라 persistence boundary다.
4. undo / redo는 화면 snapshot이 아니라 의미 있는 transaction을 복원한다.
5. navigation away / back은 편집 라이프사이클의 일부이며 저장 누락을 만들면 안 된다.
6. import / re-import는 단순 파일 읽기가 아니라 identity와 provenance가 있는 create 계열 편집이다.
7. delete는 화면에서 사라지는 동작이지만, undo / redo와 cleanup을 위해 충분한 before state를 transaction에 남겨야 한다.
8. 같은 내용을 다시 만든 것은 이전 entity와 같은 의미일 수도 있고 아닐 수도 있다. 이 판단은 ID/provenance 규칙이 결정해야 한다.

---

## EditOperationPipeline 계약

모든 product mutation은 아래 파이프라인을 통과해야 한다.

```text
UI intent
-> capture draft
-> resolve selection scope
-> normalize edit command
-> validate target and permissions
-> apply domain mutation to canonical state
-> commit history transaction
-> queue persistence
-> regenerate derived projections
-> restore or repair selection
-> report result
```

각 단계의 소유권:

- UI component: 사용자 intent와 local draft를 수집한다.
- command hook: intent를 domain command로 정규화한다.
- `SelectionScopeService`: 현재 선택이 어디에 저장되어야 하는지 결정한다.
- domain operation: canonical state를 변경하고 cleanup / reference rewrite를 수행한다.
- `EditOperationPipeline`: transaction, save queue, projection invalidation, selection restore를 조정한다.
- renderer / preview: 결과 projection을 소비한다. 저장 결정을 하지 않는다.

Panel이나 Inspector가 직접 persistence path를 결정하면 이 계약 위반이다.

---

## 현재 V1 구현 위치

현재 구현된 scaffold:

- `src/domain/editing/editOperationTypes.ts`
  - intent, target, identity effect, provenance, persistence, projection invalidation, cleanup, derived cache policy를 정의한다.
- `src/domain/editing/editOperationPipeline.ts`
  - `commitEditOperation`으로 history commit을 감싸고 operation descriptor와 cache policy를 transaction에 붙인다.
  - revision-scoped derived cache helper를 제공한다.
- `src/domain/editing/editFlushOperations.ts`
  - manual save, autosave, beforeunload, navigation flush를 persistence boundary operation으로 정규화한다.
- `src/domain/editing/projectAssetHistory.ts`
  - page/component source file을 history owner lane으로 해석하는 어댑터를 제공한다.
  - page/component save flush operation을 만든다.
- `src/domain/inspector/inspectorEditService.ts`
  - Inspector token binding edit command를 검증하고 canonical design state mutation과 operation metadata를 함께 반환한다.
  - field와 compatible token category를 domain에서 결정한다.
- `src/domain/document/editableTree.ts`
  - 현재 design foundation의 typed editable tree scaffold를 정의한다.
  - layer / selection / inspector routing은 asset 배열이 아니라 이 tree node identity를 기준으로 삼는다.
- `src/domain/document/editableTreeProjectSource.ts`
  - page/component registry의 `extensions.editableTree`를 `EditableDocumentTree`로 정규화한다.
  - registry가 비어 있거나 extension이 없으면 명시적인 diagnostic과 함께 preview scaffold fallback을 허용한다.
- `src/domain/document/editableTreeSourceParser.ts`
  - `sourceFile` 내용을 Babel AST 기반 conservative TSX tree로 읽는 기반 parser다.
  - full TSX round-trip parser가 붙기 전까지 frame / component-instance / text layer 기반 검증을 가능하게 한다.
  - TSX parse 실패, component function 부재, JSX return 부재는 조용히 빈 tree를 만들지 않고 diagnostic을 반환한다.
  - unsupported JSX expression은 visible placeholder와 diagnostic으로 남겨 이후 writeback 경계에서 처리할 수 있게 한다.
  - parsed node에는 `sourceFile`과 `sourceLocation` metadata를 남긴다.
  - source token binding은 bare token id를 compatibility metadata로 보존하되, canonical Inspector/preview 경로는 `{ collectionId, tokenId }` reference를 사용한다.
- `src/domain/document/editableTreeSourceWriteback.ts`
  - source-backed Inspector 편집을 source text 변경으로 변환하는 AST 기반 writeback boundary다.
  - write 전 현재 TSX를 다시 parse하고 `sourceLocation`으로 JSX element를 재확인한다.
  - supported token binding field는 JSX token id attribute와 collection attribute update/insert로 변환한다.
  - stale range, missing source metadata, invalid TSX는 조용히 넘어가지 않고 diagnostic을 반환한다.
  - domain helper는 파일을 직접 저장하지 않고 `nextContents`와 edit operation descriptor만 반환한다.
- `src/domain/document/editableTreeSourceInspector.ts`
  - source-backed Inspector token binding intent를 source writeback, source history commit, timeline append, persistence boundary 순서로 조정한다.
  - Inspector UI가 source write 순서와 history 저장 순서를 직접 판단하지 않게 하는 orchestration boundary다.
  - no-op 편집은 파일을 다시 쓰지 않고 명시적으로 반환한다.
  - persistence 실패는 diagnostic으로 반환하고 dirty source history를 유지한다.
- `src/domain/document/editableTreeSourceSession.ts`
  - `sourceFile`을 page/component subject로 해석한다.
  - source writeback 결과를 page/component history lane에 commit한다.
  - source contents 기준 undo / redo를 보존한다.
  - source save flush plan을 만들되 실제 file write 성공 전에는 saved 상태로 표시하지 않는다.
  - 실제 file write는 application persistence boundary에 남겨둔다.
- `src/domain/document/editableTreeSourcePersistence.ts`
  - source history lane을 injected persistence adapter와 연결한다.
  - dirty lane은 source file write 성공 후에만 saved revision으로 확정한다.
  - source write 실패는 diagnostic으로 반환하고 dirty state를 유지한다.
  - 성공 후 page/component source history lane과 `lastFlush` metadata를 persisted history file에 저장한다.
- `src/domain/selection-scope/selectionScopeService.ts`
  - editable tree selection을 domain scope 결과로 해석한다.
  - selected node, root-to-selected path, owner instance chain, source/asset/instance save target, source edit permission을 계산한다.
  - Design Editor / Inspector가 selected layer를 다시 해석해 저장 경로를 추측하지 않도록 하는 boundary다.
- `src/domain/preview/previewLayerService.ts`
  - editable tree를 flatten해서 preview layer list를 만든다.
  - component variant 목록을 layer list로 쓰는 회귀를 막는다.
- `src/domain/history/historyController.ts`
  - transaction에 `operation` metadata를 저장할 수 있다.
- `src/domain/history/historyPersistence.ts`
  - persisted lane extensions에 마지막 flush metadata를 저장할 수 있다.
- `src/features/workbench-shell/ui/useTokenEditorHistory.ts`
  - 토큰 commit을 공통 pipeline scaffold에 먼저 연결한다.
  - token manual save / autosave / beforeunload flush를 lane extension의 `lastFlush`로 남긴다.
- `src/features/workbench-shell/ui/DesignEditor.tsx`
  - design scaffold의 Inspector binding select를 `inspectorEditService`와 `commitEditOperation`으로 연결한다.
  - non-inspectable layer, incompatible binding, empty compatible-token set은 조용히 실패하지 않고 Inspector lifecycle/diagnostic message로 노출한다.
  - asset scaffold 편집은 아직 local draft history를 쓰지만, source-backed Inspector token binding 편집은 page/component source history lane과 source persistence boundary를 탄다.
  - source-backed undo / redo는 selected layer 존재 여부가 아니라 active page/component source history lane availability를 기준으로 동작한다.
  - history restore 후 canonical TSX를 다시 파싱하고 pre/post selection snapshot을 가능한 한 복원한다.
  - Inspector input focus 상태의 undo / redo도 같은 source history handler로 들어와야 하며, native input history와 별도 우주를 만들면 안 된다.
  - page/component source target 전환은 `WorkbenchSelectionState.activeTarget`으로 저장되어야 하며, panel-local target state로 남기지 않는다.
  - 좌측 Source 목록과 프리뷰 영역 source target tabs는 같은 page/component source target selection을 보여주는 두 표현이다. 두 UI 모두 같은 selection intent를 dispatch해야 하며 별도 탭 상태를 만들면 안 된다.
  - preview source target tabs의 open/close 상태는 workspace session UI state이며 `WorkbenchSelectionState.extensions`에 저장한다. 닫기는 편집 대상 registry 삭제가 아니며, 이름 변경은 page/component registry rename operation과 `.workbench/pages.json` 또는 `.workbench/components.json` persistence boundary를 통과한다.
  - preview token mode 선택도 workspace session UI state다. collection별 mode 선택은 Design Editor local state가 아니라 `WorkbenchSelectionState.extensions`에 저장한다.
  - selected design layer, panel width, sidebar split height 역시 workspace session UI state다. hook-local `useState(default)`에만 두면 refresh 이후 오염/리셋으로 취급한다.
- `scripts/check-design-editor-foundation.mjs`
  - design editor foundation regression을 검증한다.
  - layer list가 editable tree에서 파생되고 component variant 목록으로 회귀하지 않는지, source-file parser가 실패를 진단으로 노출하는지, Inspector compatibility가 domain에서 강제되는지, edit operation metadata와 history dirty/undo/redo가 보존되는지 확인한다.

아직 구현하지 않은 것:

- page/component 실제 편집 command와 history lane 연결
- Inspector edit command의 project persistence 연결
- derived cache store 자체

---

## 캐시 오염 방지 원칙

기능을 위해 cache를 쓰더라도 cache는 편집 값을 대신할 수 없다.

V1 cache rule:

1. Cacheable value는 derived data여야 한다.
2. Canonical edit operation 이후 기본 정책은 `discard-derived`다.
3. 재사용해야 하는 cache는 `revision-scoped`여야 하며 owner, source, revision fingerprint가 맞을 때만 fresh하다.
4. Clipboard payload, selection, identity, binding, token ref, provenance는 cache key를 truth로 삼으면 안 된다.
5. Cache freshness를 증명할 수 없으면 polluted value로 보고 재계산한다.

`EditOperationPipeline`은 operation마다 cache policy를 명시한다.
토큰 편집은 현재 token CSS, token query, token usage, preview projection cache를 모두 disposable derived cache로 보고 편집 후 폐기하는 정책으로 연결되어 있다.

---

## Operation Payload가 가져야 하는 정보

모든 edit operation은 최소한 아래 정보를 가져야 한다.

- `intent`: create, patch, delete, restore, copy, paste, cut, duplicate, move, reorder, import, save-flush 등 사용자 의미
- `owner`: tokens, page, component, css-class, workspace 같은 history lane 소유자
- `target`: node, token, group, mode, collection, instance, prop, style field, binding 등 실제 대상
- `scope`: source edit인지 instance override인지, 또는 token registry edit인지
- `selectionBefore`
- `selectionAfter`
- `before`
- `after`
- `identityEffect`: preserve, create, clone, move, detach, tombstone, restore
- `provenance`: importedFrom, clonedFrom, pastedFrom, restoredFrom 같은 선택적 출처
- `history`: independent transaction인지 merge 가능한 draft 입력인지
- `persistence`: affected files와 save queue 정책
- `projection`: preview, token CSS, renderer payload, selection model 중 무엇을 재생성할지
- `cleanup`: refs, bindings, field scopes, instance overrides, stale imports 정리 계획

`before`와 `after`는 구현상 snapshot일 수도 있고 patch일 수도 있다.
중요한 것은 undo / redo와 persistence recovery가 사용자의 의미 상태를 복원할 수 있어야 한다는 점이다.

---

## 편집 상태의 구분

V1은 상태를 아래처럼 구분해야 한다.

- transient draft: input focus 중인 아직 commit되지 않은 값
- committed working value: history에는 들어갔지만 아직 저장되지 않은 값
- persisted value: 파일이나 프로젝트 저장소에 반영된 값
- historical value: undo / redo stack 안에 있는 의미 상태
- imported value: 외부 출처와 identity mapping이 있는 값
- removed value: 현재 canonical tree에서는 빠졌지만 history transaction 안에서는 복원 가능한 값
- recreated value: 같은 내용이지만 새 identity를 가질 수 있는 값
- derived value: renderer, preview, expanded subtree, filter result처럼 언제든 재계산 가능한 값

이 구분 없이 "현재 화면에 보이는 값"을 저장 기준으로 삼으면 지우기, 다시 쓰기, import 후 삭제, 재import 같은 케이스에서 drift가 생긴다.

---

## 복사 / 붙여넣기 / 복제 / 잘라내기

이 네 동작은 비슷해 보이지만 같은 연산이 아니다.

### Copy

- canonical state를 변경하지 않는다.
- clipboard payload를 만든다.
- payload는 source identity를 그대로 저장하지 말고 출처로만 기록해야 한다.
- paste 전까지 history transaction이 아니다.

### Paste

- clipboard payload로 새 canonical entity나 subtree를 만든다.
- 기본값은 새 identity 발급이다.
- token refs, component refs, imported refs는 target workspace에서 유효한지 다시 검증해야 한다.
- 붙여넣기 결과 selection은 새로 생성된 대상이어야 한다.

### Duplicate

- 같은 owner 안에서 기존 대상을 복제한다.
- 새 identity를 발급하지만 local 관계는 유지하거나 재매핑해야 한다.
- self-contained refs는 copied set 안으로 retarget될 수 있다.
- duplicate 자체는 history transaction이다.

### Cut

- copy payload를 만든 뒤 canonical state에서 제거한다.
- paste가 이어지지 않아도 삭제 transaction으로 남아야 한다.
- 같은 gesture 안에서 cut + paste가 완료되면 move transaction으로 합칠 수 있다.

### Move / Reorder

- identity를 유지한다.
- 위치, parent, sort order, group membership 같은 관계만 바뀐다.
- undo / redo는 값이 아니라 위치와 관계를 복원해야 한다.

---

## 편집 연산이 왜 중요한가

편집기에서 중요한 것은 화면이 아니라 상태 변화의 의미다.

예를 들어 사용자가 인스펙터에서 값을 바꿨다고 해도, 시스템은 알아야 한다.

- 이건 source를 바꾸는가
- instance를 바꾸는가
- style layer를 바꾸는가
- history에서 하나의 연산인가
- structural edit인가
- preview 전체 재생성이 필요한가

이 질문을 UI 컴포넌트가 각자 답하면 아키텍처가 무너진다.

V1에서는 edit operation이 이 질문의 공통 언어가 되어야 한다.

---

## V1에서 필요한 기본 연산 종류

## 1. Create

새로운 구조나 엔티티를 만든다.

예:

- 노드 생성
- 컴포넌트 생성
- 페이지 생성
- 토큰 생성
- instance import

## 2. Patch

기존 구조는 유지하고 일부 속성만 바꾼다.

예:

- prop 변경
- text 변경
- style 변경
- variant 선택 변경

## 3. Structural Change

트리 구조 자체를 바꾼다.

예:

- 자식 추가
- 삭제
- 이동
- wrap / unwrap
- slot 교체

## 4. Clone

같은 구조를 바탕으로 새 identity를 가진 존재를 만든다.

예:

- duplicate
- 특정 subtree 복제

## 5. Remove

구조에서 제거한다.

예:

- 노드 삭제
- instance 삭제
- style binding 제거

## 6. Restore

이전 의미 상태를 복구한다.

예:

- undo
- redo
- history restore

## 7. Reconcile

원본/계약/variant 변화에 따라 파생 구조나 instance 상태를 다시 맞춘다.

예:

- source 수정 후 instance 재정렬
- variant 축 변경 후 selection fallback
- prop 계약 변경 후 stale 값 제거

## 8. Copy

대상을 clipboard payload로 직렬화한다.

예:

- 선택 노드 복사
- 토큰 복사
- inspector field value 복사

주의:

- canonical state는 바꾸지 않는다.
- paste 가능한 payload contract를 만드는 것이 핵심이다.

## 9. Paste

clipboard payload를 현재 scope에 적용한다.

예:

- 복사한 노드 붙여넣기
- 복사한 토큰을 다른 컬렉션에 붙여넣기
- 복사한 inspector field value를 호환 필드에 붙여넣기

주의:

- 기본적으로 새 identity를 만든다.
- 참조와 provenance를 현재 workspace 기준으로 재검증한다.

## 10. Cut

copy와 remove가 결합된 연산이다.

예:

- 선택 노드를 잘라내기
- token row를 잘라내기

주의:

- paste가 실패하거나 취소되어도 remove 결과가 명확해야 한다.
- 같은 gesture 안에서 paste까지 완료되면 move transaction으로 합칠 수 있다.

## 11. Move / Reorder

identity는 유지하고 위치나 순서를 바꾼다.

예:

- layer reorder
- token sortOrder 변경
- group 이동
- mode column reorder

## 12. Import

외부 source를 Workbench canonical model로 받아들인다.

예:

- TSX import
- component import
- token JSON import
- design-system asset import

주의:

- imported entity는 `importedFrom` 같은 provenance를 가져야 한다.
- 기존 entity와 merge할지 새 identity로 만들지는 import policy가 결정한다.

## 13. Save Flush

저장 전 현재 draft와 working state를 canonical entity로 밀어 넣는다.

예:

- manual save
- autosave
- beforeunload backup
- entity navigation before switch

주의:

- save flush는 사용자 의미의 편집이 아니라 persistence boundary다.
- 단, flush가 누락되면 최종값 보존이 깨지므로 pipeline 단계로 명시되어야 한다.

---

## 각 연산이 정의해야 하는 것

모든 edit operation은 최소한 아래를 정의해야 한다.

### 1. 대상

무엇을 수정하는가

- source node
- instance
- style layer
- token
- entity

### 2. 귀속 위치

최종 저장은 어디에 되는가

- source
- instance
- style definition
- session state

### 3. identity 영향

- 기존 identity 유지
- 새 identity 발급
- owner 환원 필요

### 4. history 단위

- 독립 transaction인가
- 이전 편집과 merge 가능한가

### 5. projection 영향 범위

- preview overlay만 갱신
- CSS projection만 갱신
- 전체 preview 재생성 필요

---

## 예시 연산 해석

## 예시 1. 노드의 텍스트만 변경

연산 타입:

- Patch

귀속:

- source 또는 instance contract

판단 필요:

- 지금 선택이 source 편집인지
- instance override인지

projection 범위:

- 대체로 부분 갱신 가능

## 예시 2. 버튼 컴포넌트의 기본 padding 변경

연산 타입:

- Patch

귀속:

- component source style

projection 범위:

- 해당 source를 참조하는 인스턴스에 영향

## 예시 3. 특정 인스턴스만 색상 변경

연산 타입:

- Patch

귀속:

- instance-local style override

projection 범위:

- 해당 instance만

## 예시 4. 자식 노드 삭제

연산 타입:

- Structural Change

귀속:

- source tree 또는 instance-local structure 허용 범위

projection 범위:

- 전체 구조 재계산 가능

## 예시 5. duplicate

연산 타입:

- Clone

귀속:

- 현재 편집 tree에 새 구조 추가

identity 영향:

- 새 node id / 새 instance id 발급

---

## structural edit와 non-structural edit의 구분

이 구분은 V1에서 매우 중요하다.

## structural edit

다음을 바꾼다.

- 트리 shape
- 자식 관계
- 노드 존재 여부
- owner 관계

예:

- 추가
- 삭제
- 이동
- wrap
- unwrap

특징:

- history에서 독립 transaction이 되기 쉽다
- preview 재생성 범위가 크다

## non-structural edit

다음을 바꾼다.

- prop 값
- 스타일 값
- variant 선택
- text 값

특징:

- 부분 갱신 가능성이 높다
- 구조 identity는 유지된다

V1에서는 이 구분이 update scope 판단의 핵심이 되어야 한다.

---

## intent 기반 업데이트 범위 판단

V1에서는 "무엇이 바뀌었는지 deep diff"보다 "어떤 연산이 발생했는지"로 update scope를 결정하는 것이 더 안전하다.

예:

- `select-node` -> overlay만 갱신
- `hover-node` -> hover만 갱신
- `patch-style-local` -> CSS projection만 갱신
- `patch-instance-prop` -> instance projection 갱신
- `structural-remove-node` -> 구조 재계산

즉 연산 타입이 곧 invalidation 범위를 안내해야 한다.

---

## panel이 하면 안 되는 일

V1에서 panel은 edit operation을 직접 정의하면 안 된다.

예:

- 인스펙터가 "이건 source 저장"이라고 직접 판단
- preview가 "이건 instance override"라고 직접 판단

이렇게 되면 같은 연산이 UI 위치에 따라 다른 의미를 갖게 된다.

따라서 panel은:

- 사용자 intent를 수집하고
- edit operation 호출만 해야 한다

실제 귀속 판정은 공통 계층으로 올라가야 한다.

---

## undo / redo에서 중요한 점

history는 raw state diff보다 edit operation semantics와 더 가깝게 설계되는 것이 좋다.

왜냐하면 사용자는 단순히 값이 아니라 "방금 한 의미 있는 편집"이 되돌아오길 기대하기 때문이다.

따라서 V1에서는:

- 어떤 편집이 하나의 transaction인지
- 연속 스타일 입력을 묶을지
- 구조 편집은 즉시 끊을지

를 연산 단위에서 함께 정의해야 한다.

2026-05-06 Design Editor 기준으로 source-backed undo / redo는 active
page/component source history lane을 복원한다. Inspector 입력창에 포커스가
있더라도 `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, `Ctrl+Y`, 그리고 브라우저의
`beforeinput` history 이벤트는 native input history가 아니라 Workbench
source history lane으로 라우팅되어야 한다. 입력 필드는 draft state를 가질
수 있지만, undo / redo의 authority는 입력 DOM이 아니라 canonical source
contents와 transaction selection snapshot이다.

---

## 라이프사이클 회귀 케이스

Inspector와 preview editing을 붙이기 전에 아래 케이스를 regression 기준으로 삼는다.

| 케이스 | 보존해야 하는 것 | 실패하면 생기는 문제 |
| --- | --- | --- |
| 값 쓰기 -> 저장 -> reload | committed value, selection fallback | 새로고침 후 이전 값으로 돌아감 |
| 값 쓰기 -> 메뉴 이동 -> 돌아오기 | entity flush, working value | 다른 메뉴 이동 중 입력값 유실 |
| 값 수정 중 blur | draft commit policy | 보이는 값과 저장 값 불일치 |
| 값 수정 중 escape/cancel | previous committed value | 취소했는데 일부만 저장됨 |
| 삭제 -> undo | removed target, refs, selection | 대상은 돌아오지만 binding/ref가 깨짐 |
| 삭제 -> redo | cleanup result | redo 후 stale ref가 남음 |
| 삭제 -> 같은 내용 다시 만들기 | new identity vs restored identity 판단 | 기존 override/history가 엉뚱하게 붙음 |
| copy -> paste | new identity, valid refs | 원본 ID 충돌 또는 self-ref 오류 |
| duplicate | cloned identity map, local ref retarget | 복제본이 원본 token/node를 잘못 참조 |
| cut -> paste | move semantics or delete+create policy | undo 시 위치나 selection이 꼬임 |
| reorder -> undo | stable identity and previous order | 값은 맞지만 순서가 복원되지 않음 |
| import -> delete -> re-import | provenance and import policy | 기존 삭제 상태와 새 import가 충돌 |
| import -> edit -> save -> reload | imported value promoted to canonical working value | reload 후 import 직후 상태로 회귀 |
| undo -> autosave | history guard / save sequencing | undo 직후 이전 tree가 복원 상태를 덮어씀 |
| redo -> navigation | redo result flush | 이동 후 redo 결과가 저장되지 않음 |
| input focus -> undo/redo | active source history lane, canonical contents, selection snapshot | 입력 DOM만 되돌아가고 TSX/preview/history가 다른 상태가 됨 |
| source edit -> file write failure | dirty source lane, diagnostic | 저장 실패인데 clean 상태가 되어 최종값을 잃음 |
| token rename/delete | reference rewrite / cleanup | preview나 inspector binding이 stale ref를 참조 |
| instance override edit | save target and owner instance | source와 instance 중 잘못된 곳에 저장 |

이 표는 구현 체크리스트가 아니라 제품 신뢰성 기준이다.
새 편집 기능을 추가할 때는 이 표에서 해당되는 케이스를 먼저 고르고, 빠진 케이스가 있으면 표를 갱신한다.
Design editor foundation 변경 후에는 `npm run workbench:check-design`으로 layer / inspector / operation / history 회귀를 먼저 검증한다.

---

## Inspector 이전에 필요한 기반 작업

Inspector UI를 본격적으로 붙이기 전에 다음 기반이 필요하다.

1. `EditOperationPipeline` 타입과 처리 단계를 정의한다.
2. token editor의 history lane / autosave queue / selection snapshot 경험을 공통 pipeline으로 일반화한다.
3. page/component owner lane을 추가해 token 외 편집도 같은 history contract를 쓰게 한다.
4. `SelectionScopeService` 결과를 operation payload의 `scope`와 `target`으로 연결한다.
5. `save flush`를 명시적 pipeline 단계로 만들고 navigation / beforeunload / manual save가 같은 경로를 타게 한다.
6. import / duplicate / paste에서 identity map과 provenance를 기록하는 공통 helper를 만든다.
7. delete / restore / cleanup regression을 token, node, instance, binding 단위로 나눠 검증한다.

이 순서를 건너뛰고 Inspector field UI부터 늘리면 이전 버전에서 보였던 panel-local save routing 문제가 다시 생긴다.

---

## 최종 정리

V1에서 편집은 화면 이벤트의 집합이 아니라, 의미 있는 edit operation의 집합이어야 한다.

그리고 각 연산은 반드시 정의해야 한다.

- 무엇을 바꾸는가
- 어디에 저장되는가
- 어떤 ID에 영향을 주는가
- history 단위는 무엇인가
- projection을 어디까지 다시 계산해야 하는가

추가로 이제는 반드시 정의해야 한다.

- draft가 언제 commit되는가
- 저장 전 flush가 언제 실행되는가
- undo / redo가 어떤 selection과 scope를 복원하는가
- copy / paste / duplicate / import가 identity를 어떻게 발급하거나 재매핑하는가
- delete / restore가 refs, bindings, overrides를 어떻게 정리하거나 되돌리는가

한 문장으로 줄이면:

**V1의 핵심은 "UI가 무엇을 눌렀는가"가 아니라, "시스템이 어떤 편집 연산을 수행했는가"다.**
