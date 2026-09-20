# WORKBENCH-V1 Source of Truth

## 왜 이 문서가 필요한가

이전 버전에서 가장 오래 흔들린 질문 중 하나는 이것이었다.

**최종값은 어디에 있는가?**

후보는 여러 개였다.

- 노드 트리
- Monaco 에디터 안의 코드
- expanded subtree
- preview에 보이는 DOM 근사 상태

이 질문이 흔들리면 모든 것이 흔들린다.

- 편집 귀속
- 저장
- undo/redo
- selection 복원
- preview 갱신
- instance override

V1에서는 반드시 "누가 진실인가"를 계층별로 명확히 정해야 한다.

---

## 핵심 결론

**V1에서 평상시 편집의 canonical truth는 working tree다. 코드는 projection이며, Monaco 직접 편집은 tree를 다시 갱신하는 예외적 입력 경로다.**

이 문장이 이 문서의 핵심이다.

추가로, Codex Desktop이 작성한 TSX/source는 V1의 중요한 authoring input이다. 사용자가 Codex에게 페이지나 컴포넌트 생성을 요청하면 Codex는 실제 프로젝트 소스를 만들 수 있고, Workbench는 그 소스를 editable tree로 파싱해 preview, layers, inspector에서 편집 가능하게 투영해야 한다.

이것은 앱 내부 AI 채팅 기능을 뜻하지 않는다. Codex는 앱 밖에서 소스를 작성하고, Workbench 안에서의 평상시 시각 편집은 다시 working tree를 canonical truth로 삼는다.

---

## 왜 code를 항상 최종 truth로 두면 안 되는가

겉보기에는 code를 최종값으로 두는 것이 자연스러워 보일 수 있다.

왜냐하면:

- 최종 산출물이 코드이고
- Monaco에 실제 텍스트가 있고
- parse만 하면 트리로 다시 만들 수 있기 때문이다

하지만 실시간 편집기에서는 이 방식이 곧바로 어려워진다.

### 문제 1. 부분 편집의 의미를 잃기 쉽다

예:

- 노드 하나 선택
- 일부 스타일 수정
- 특정 인스턴스만 override

이런 편집을 매번 "전체 코드 텍스트 수정"으로만 다루면 의미 단위가 무너진다.

### 문제 2. selection / scope 복원이 약해진다

코드는 텍스트이기 때문에 현재 사용자의 선택 맥락을 직접 보존하지 못한다.

### 문제 3. nested instance 귀속이 더 어려워진다

어떤 수정이:

- source를 바꾸는지
- instance override인지
- 허용되지 않는지

를 텍스트 기준으로만 다루기가 어렵다.

### 문제 4. history가 바이트 중심으로 흐르기 쉽다

그렇게 되면 undo/redo가 의미 복원이 아니라 문자열 복원에 가까워진다.

---

## 왜 tree를 canonical truth로 두는가

Workbench는 일반 텍스트 에디터가 아니라 구조적 편집기다.

즉 기본 편집은 다음과 같다.

- 노드를 선택한다
- 구조를 바꾼다
- prop을 바꾼다
- 스타일 귀속 대상을 정한다
- instance 값을 바꾼다

이 모든 것은 텍스트보다 tree가 더 자연스럽게 표현한다.

따라서 V1에서는:

- 구조 편집
- 시각 편집
- inspector 편집
- selection/scope 모델

이 모두 working tree를 중심으로 돌아가는 것이 맞다.

---

## V1의 진실 계층

V1에서는 truth를 하나만 두는 것이 아니라, "각 층마다 하나의 canonical truth"를 둬야 한다.

## Codex가 생성한 TSX의 위치

Codex가 작성한 TSX는 다음 위치에 있다.

- source artifact
- authoring input
- editable tree로 들어오는 import/parse 대상

따라서 의도한 흐름은 다음과 같다.

```text
사용자 요청 -> Codex가 TSX 작성 -> source parser -> working tree/editable tree -> preview/layers/inspector -> edit operation -> source writeback/code sync -> renderer verification
```

중요한 점은 Codex-generated TSX가 "편집 완료된 최종 문자열"로 고정되는 것이 아니라는 점이다. Workbench가 그 소스를 구조적으로 이해할 수 있어야 하며, 사용자는 이후 token picker, inspector, preview edit, layer selection을 통해 필요한 부분을 다시 편집할 수 있어야 한다.

## 1. 문서 구조의 진실

canonical truth:

- working tree
- persisted entity tree

역할:

- 구조 편집의 기준
- selection/scope의 기준
- history의 기본 복원 단위

## 2. 컴포넌트 인스턴스 상태의 진실

canonical truth:

- compressed instance state

예:

- origin
- propValues
- variantSelection
- instance-local overrides

이것은 expanded subtree가 아니다.

## 3. expanded subtree의 진실 여부

canonical truth:

- 아님

상태:

- derived view
- selection/hit-test/preview용 계산 결과

즉 expanded subtree는 보여줄 수 있고 선택할 수는 있어도, 최종 저장의 주인이 되어서는 안 된다.

## 4. 코드의 진실 여부

canonical truth:

- 평상시에는 아님

상태:

- codegen projection
- export artifact
- Monaco 직접 편집 시 입력 채널

즉 코드는 항상 중요한 결과물이지만, 평상시 편집의 유일 진실은 아니다.

## 5. preview payload의 진실 여부

canonical truth:

- 아님

상태:

- renderer projection

---

## Monaco 직접 편집은 어떻게 다뤄야 하는가

V1에서 Monaco는 중요하다.
하지만 위치를 정확히 정해야 한다.

### 기본 원칙

Monaco는 "항상 최종 truth"가 아니라, "직접 코드 입력 경로"다.

즉 흐름은 이렇다.

1. 평상시 편집: tree 기반
2. 사용자가 Monaco에서 직접 수정
3. parse 수행
4. parse 성공 시 tree를 갱신
5. 이후 다시 tree가 canonical truth로 복귀

이 모델이 가장 현실적이다.

즉 Monaco는 강력한 입력 수단이지만, 시스템 전체의 기본 편집 모델을 대체하지는 않는다.

---

## 저장 모델

V1에서 저장은 "현재 보이는 것 전체를 아무 데나 덤프"하는 것이 아니라, canonical state를 저장하는 과정이어야 한다.

### 저장해야 하는 것

- entity tree
- component source
- instance state
- style 구조
- token 구조

### 저장하면 안 되는 것

- preview payload
- hover 상태
- renderer 임시 상태
- 계산된 expanded subtree 자체

### 조건부 저장 대상

- history snapshot
- session selection/scope

이건 persisted document와 editor session을 나누어 판단해야 한다.

---

## V1의 기본 편집 흐름

기본 편집 흐름은 아래와 같아야 한다.

1. 사용자가 편집한다
2. 편집 intent가 발생한다
3. working tree 또는 instance state가 갱신된다
4. 필요한 derived model이 재계산된다
5. preview projection이 갱신된다
6. code projection이 필요 시 갱신된다

중요한 점은:

**항상 canonical state가 먼저, projection은 나중**이어야 한다.

---

## 왜 이 원칙이 stale state를 줄이는가

stale state는 보통 derived 값이 원본보다 앞서거나, derived 값이 따로 살아남을 때 생긴다.

V1에서는:

- working tree를 먼저 갱신하고
- 그 다음 projection을 다시 만들기 때문에
- projection이 진실을 오염시킬 가능성이 줄어든다

즉 "최신값을 무엇으로 볼 것인가"가 분명하면 stale state 방어가 쉬워진다.

---

## 왜 이 원칙이 깜빡거림 문제와도 연결되는가

깜빡거림을 줄이려면 projection을 부분 갱신해야 한다.
그런데 부분 갱신을 하려면 먼저 canonical state가 분명해야 한다.

즉:

- source of truth가 흔들리면
- 무엇이 바뀌었는지 판단도 흔들리고
- 결국 전체 재구성이 자주 일어난다

반대로 canonical state가 분명하면:

- structural edit인지
- non-structural edit인지
- preview overlay만 갱신하면 되는지

를 더 잘 나눌 수 있다.

---

## V1에서 하지 말아야 할 것

## 1. code와 tree를 동급의 진실로 두기

둘 다 중요하지만, 평상시 편집에서는 동급 truth가 아니다.

## 2. expanded subtree를 저장 진실처럼 다루기

이건 source/instance 모델을 흐린다.

## 3. preview payload를 되먹임해서 source처럼 취급하기

preview는 projection이지 truth가 아니다.

## 4. panel이 자기 로컬 상태를 사실상의 최종값으로 오래 들고 있기

패널은 표시 계층이어야지 별도 truth가 되면 안 된다.

---

## 최종 정리

V1에서:

- 평상시 편집의 최종 진실은 working tree
- component instance의 최종 진실은 compressed instance state
- code는 projection이자 직접 편집 입력 경로
- expanded subtree는 derived view
- preview payload는 renderer projection

한 문장으로 줄이면:

**Workbench V1는 "코드를 만드는 편집기"이지만, 평상시 편집의 진실은 코드가 아니라 구조화된 working state에 있어야 한다.**
