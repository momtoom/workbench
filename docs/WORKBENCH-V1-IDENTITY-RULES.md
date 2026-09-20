# WORKBENCH-V1 ID 규칙

## 왜 이 문서가 중요한가

Workbench 같은 실시간 편집기에서 가장 깊은 문제는 종종 "무엇이 바뀌었는가"가 아니라 "무엇이 같은 것인가"다.

이 질문이 흔들리면 다음이 전부 흔들린다.

- selection
- CSS anchor
- override routing
- binding target
- duplicate semantics
- delete/restore
- undo/redo
- import / re-import

이전 버전에서 UUID, `WBID`, instance 식별, expanded 내부 노드 식별이 점점 늘어난 이유도 결국 이 문제 때문이다.

V1에서는 ID를 "하나의 만능 값"으로 보지 않고, 역할별로 분리해야 한다.

---

## 핵심 결론

**V1에서는 하나의 ID로 모든 문제를 풀지 않는다. 각 ID는 역할이 다르며, 역할이 다르면 수명과 안정성 규칙도 달라진다.**

---

## 이전 버전에서 어떤 일이 있었는가

초기에는 node UUID를 중심으로 생각하기 쉬웠다.

하지만 편집기에서는:

- parse/codegen
- 구조 재생성
- instance expand
- tree reconciliation

같은 과정에서 UUID가 계속 바뀔 수 있었다.

그 결과:

- CSS가 노드를 못 찾고
- selection이 흔들리고
- override target이 어긋나고
- 결국 `WBID` 같은 별도 anchor가 생겼다

이건 잘못된 시도가 아니라, 역할이 다른 identity를 하나로 다루려다 생긴 자연스러운 보정이었다.

V1에서는 이를 명시적 모델로 끌어올려야 한다.

---

## V1에서 필요한 ID 종류

V1에서는 최소한 다음 identity를 분리해서 본다.

## 1. Entity ID

대상:

- page
- component
- token collection

역할:

- 문서 레벨 엔티티 식별
- 저장/로드/탭/라우팅 기준

규칙:

- 영속적이어야 함
- 같은 엔티티를 가리킬 때 유지되어야 함

## 2. Source Node ID

대상:

- source tree 안의 노드

역할:

- 구조적 편집 기준
- selection/history 복원 기준
- source tree 내부 참조 기준

규칙:

- parse/codegen round-trip에서도 가능한 한 안정적이어야 함
- duplicate 시 새로 발급
- source 구조 identity로 사용

중요:

이 값은 runtime에서 잠깐 쓰는 id와 혼동하면 안 된다.

## 3. Instance ID

대상:

- component instance 하나

역할:

- instance-local state의 귀속 기준
- propValues / variantSelection / local override의 owner
- nested instance chain 계산 기준

규칙:

- source node id와 다름
- expanded child들의 id와도 다름
- instance 하나를 대표하는 안정 값이어야 함

## 4. Style Anchor ID

대상:

- 스타일 targeting용 anchor

역할:

- 특정 노드/instance를 스타일링 대상으로 찾기 위한 내부 키
- preview selection / local style override routing 등에 사용 가능

규칙:

- node identity 전체를 대체하지 않음
- 스타일 시스템의 중심 철학이 아님
- 필요 시 유지되지만 역할은 제한적이어야 함

V1에서의 해석:

`WBID`가 있다면 여기에 해당한다.

## 5. Expanded View Node ID

대상:

- source + instance 상태로부터 계산된 expanded subtree 내부 노드

역할:

- preview hit-test
- hover
- drill-in selection

규칙:

- 파생 view용
- 영속 진실이 아님
- 저장 기준이 되어선 안 됨
- owner source / instance로 환원 가능한 방식이어야 함

## 6. Runtime DOM ID

대상:

- 실제 DOM / renderer 상호작용용 값

역할:

- overlay targeting
- hover / focus
- DOM query

규칙:

- 렌더마다 재계산 가능
- persistence 기준 아님

---

## 각 ID가 해결하는 문제

| ID 종류 | 해결하는 문제 | 해결하면 안 되는 문제 |
|---|---|---|
| Entity ID | 문서 레벨 엔티티 식별 | 내부 노드 스타일 targeting |
| Source Node ID | source 구조 identity | instance-local override owner |
| Instance ID | instance 상태 귀속 | source 구조 identity |
| Style Anchor ID | 스타일 targeting | history 구조 identity |
| Expanded View Node ID | preview 상호작용 | persistence anchor |
| Runtime DOM ID | 렌더 상호작용 | source/instance 저장 기준 |

---

## 가장 중요한 분리

## 1. Source Node ID != Instance ID

컴포넌트 원본 안의 버튼 노드와, 그 컴포넌트를 사용하는 특정 인스턴스는 다른 수준의 identity다.

## 2. Style Anchor ID != Source Node ID

스타일 targeting을 위한 anchor는 source 구조 identity와 같은 값일 수도 있지만, 개념적으로는 다른 역할이다.

## 3. Expanded View Node ID != Persisted Truth

preview에서 고른 노드가 있더라도, 저장은 결국 source 또는 instance owner로 환원되어야 한다.

## 4. Runtime DOM ID != Editor Persistence ID

렌더러가 쓰는 값은 편집기의 장기 저장 identity가 아니다.

---

## duplicate / delete / restore에서의 규칙

## duplicate

중복 생성 시:

- entity는 새 entity가 아니면 유지
- source node duplicate는 새 source node id 발급
- instance duplicate는 새 instance id 발급
- style anchor는 정책에 따라 새로 발급 가능

핵심:

duplicate는 "같은 구조의 새 존재"이지, 동일 객체의 또 다른 표현이 아니다.

## delete

삭제 시:

- 해당 identity는 현재 문서에서 제거됨
- selection/history에서 더 이상 활성 기준이 될 수 없음

## restore

undo/redo 또는 복원 시:

- "같은 편집 연속성"을 복원하려면 source node id / instance id가 복원되어야 함
- 단, 새로 import한 경우는 restore가 아니라 새 생성일 수 있음

즉 restore와 re-create는 다르게 다뤄야 한다.

---

## import / re-import의 규칙

컴포넌트를 가져오는 행위는 source 복원이 아니라 새 usage site 생성에 가깝다.

즉 import 시:

- source는 기존 component entity를 참조
- instance는 새로 생성
- instance id는 새로 발급

delete 후 다시 import는 보통:

- 같은 instance의 부활이 아니라
- 새 instance 생성

으로 해석하는 것이 더 자연스럽다.

단, 별도의 restore/undo 흐름은 예외다.

---

## history에서의 규칙

history는 identity를 매우 중요하게 다뤄야 한다.

왜냐하면 사용자는 undo/redo에서 단순히 비슷한 구조가 아니라 "방금 수정하던 그것"이 돌아오길 기대하기 때문이다.

따라서:

- source node id는 가능한 한 보존되어야 하고
- instance id도 같은 edit lineage에서는 복원되어야 하며
- expanded view id는 굳이 history의 주인이 될 필요가 없다

---

## V1에서 하지 말아야 할 것

## 1. 하나의 UUID로 모든 문제를 해결하려 하기

이건 다시 같은 복잡성을 부른다.

## 2. 스타일 anchor를 편집기의 만능 identity로 승격시키기

`WBID`는 보조 anchor이지 전체 모델의 중심이 아니다.

## 3. expanded 내부 노드 id를 저장 기준으로 쓰기

이건 source/instance 경계를 다시 흐린다.

## 4. runtime DOM 식별자를 history/persistence에 연결하기

렌더 계층 값은 영속 모델과 분리해야 한다.

---

## 최종 정리

V1에서 ID는 하나가 아니라 계층별 역할이 다르다.

- Entity ID는 문서 엔티티용
- Source Node ID는 구조 편집용
- Instance ID는 사용 지점 state용
- Style Anchor ID는 스타일 targeting용
- Expanded View Node ID는 preview 상호작용용
- Runtime DOM ID는 렌더 계층용

한 문장으로 줄이면:

**같아 보여도 역할이 다르면 다른 ID여야 하며, 역할이 다르면 안정성 규칙도 달라야 한다.**
