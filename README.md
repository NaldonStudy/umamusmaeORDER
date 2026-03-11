# 🏇 RaceOrder — 실시간 순위 결정 레이스 앱

> 최대 12팀이 참가하는 실시간 경주 연출 기반의 순위 결정 웹 애플리케이션

---

## 📌 프로젝트 개요

팀 이름과 간단한 스탯을 입력하면 실시간 레이스 애니메이션을 통해 순위를 결정해주는 웹 앱입니다.  
경주 중 조건부 스킬이 자동 발동되어 역전, 막판 추입, 속도 부스트 등의 이벤트가 발생하며, 결과 화면에서 최종 순위와 주요 이벤트 로그를 확인할 수 있습니다.

---

## 🎯 주요 기능

| 기능 | 설명 |
|------|------|
| **팀 등록** | 최대 12팀, 팀 이름 / 대표 색상 / 기초 스탯 입력 |
| **실시간 레이스** | 틱 기반 위치 계산, 추월 판정, 결승선 통과 시점 기록 |
| **스킬 시스템** | 6~10종의 조건부 스킬 (선두 유지, 후반 추입, 랜덤 부스트 등) |
| **결과 화면** | 최종 순위, 발동 스킬 수, 베스트 추월 등 통계 요약 |
| **텍스트 로그** | 레이스 중계 느낌의 이벤트 실시간 출력 |

---

## 🗂️ 화면 구성

```
TeamSetup (팀 입력)
    ↓
RaceTrack (레이스 진행)
    ↓
ResultBoard (결과 및 통계)
```

---

## 🔧 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React + TypeScript |
| 빌드 도구 | Vite |
| 스타일 | Tailwind CSS / CSS Modules |
| 상태 관리 | Zustand 또는 React 내장 상태 |
| 렌더링 | DOM / CSS 애니메이션 (이후 PixiJS 또는 Canvas 확장 검토) |
| 사운드 | 추후 Howler.js 도입 검토 |

---

## 📁 프로젝트 구조

```
umamusmaeORDER/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── race.ts           # 타입 정의 (Team, Skill, RaceState)
│   ├── data/
│   │   └── skills.ts         # 스킬 데이터 정의
│   ├── lib/
│   │   └── raceEngine.ts     # 레이스 로직 코어 (틱 계산, 스킬 발동)
│   ├── components/
│   │   ├── TeamSetup.tsx     # 팀 등록 화면
│   │   ├── RaceTrack.tsx     # 레이스 진행 화면
│   │   ├── SkillLog.tsx      # 스킬 발동 로그
│   │   └── ResultBoard.tsx   # 결과 화면
│   └── styles/
│       └── race.css
├── package.json
└── README.md
```

---

## 📐 데이터 모델

```typescript
// 팀 정보
interface Team {
  id: string;
  name: string;
  color: string;
  baseSpeed: number;
  acceleration: number;
  stamina: number;
  condition: number;
  skills: Skill[];
}

// 스킬 정의
interface Skill {
  id: string;
  name: string;
  trigger: TriggerCondition;
  duration: number;
  effectType: 'speed' | 'acceleration' | 'resistance';
  effectValue: number;
  cooldown: number;
}

// 레이스 상태
interface RaceState {
  phase: 'setup' | 'racing' | 'finished';
  elapsedTime: number;
  positions: Record<string, number>;
  activeEffects: ActiveEffect[];
  logs: RaceLog[];
  rankings: string[];
}
```

---

## 🏁 레이스 엔진 구조

```
매 틱마다:
  기본 속도
  + 랜덤 편차
  + 컨디션 보정
  + 활성화된 스킬 효과
  = 이번 틱 이동 거리

→ 위치 업데이트 → 추월 판정 → 결승선 도달 확인
```

### 스킬 종류 (예정)

| 스킬명 | 발동 조건 | 효과 |
|--------|-----------|------|
| 선두 질주 | 1위 유지 중 | 속도 +10% |
| 막판 스퍼트 | 잔여 거리 20% 이하 | 가속 대폭 상승 |
| 추격의 불꽃 | 3위 이하 진입 시 | 순간 속도 부스트 |
| 랜덤 부스트 | 무작위 | 단기 속도 강화 |
| 방해 저항 | 근접 경쟁 중 | 속도 감소 무효화 |
| 침착한 페이스 | 전반전 유지 | 스태미나 소모 감소 |

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

## 📅 개발 로드맵

- [x] 프로젝트 구조 설계 및 기술 스택 확정
- [ ] **1단계**: 4팀 기준 레이스 흐름 완성 (레이스 엔진 + 기본 UI)
- [ ] **2단계**: 12팀까지 확장 및 레인 UI 최적화
- [ ] **3단계**: 스킬 다양화 및 애니메이션 연출 강화
- [ ] **4단계**: 결과 공유, 다시 달리기, 사운드 등 부가 기능

---

## ⚠️ 주의사항

본 프로젝트는 경주 레이스 장르에서 영감을 받아 **독자적으로 제작된 앱**입니다.  
캐릭터 디자인, 명칭, UI 아트, 사운드, 텍스트 에셋은 모두 오리지널로 제작되며, 특정 기존 IP의 에셋을 포함하지 않습니다.

---

## 📄 라이선스

MIT License
