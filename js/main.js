/* =============================================================
   main.js
   - 메인 페이지(index.html) 전용 스크립트
   - GSAP + ScrollTrigger 로 스크롤 인터랙션 구현
   - 기능별로 함수를 나눠 두어 유지보수가 쉽습니다.
       1) reveal        : 요소가 화면에 들어올 때 나타나는 효과
       2) heroExit      : 1번 Hero(PORTFOLIO)가 사라지는 연결 동작
       3) sloganScene   : 2번 슬로건 - 구체가 커지고 텍스트가 등장
       4) webappCarousel: 웹앱 섹션 썸네일/화살표 캐러셀
       5) compareSlider : UX 개선 Before/After 비교 슬라이더
       6) projectToggle : 프로젝트 이미지 Before/After 토글
   ============================================================= */

(function () {
  "use strict";

  /* 사용자가 "동작 줄이기"를 켰는지 확인 (접근성) */
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* 모든 초기화는 페이지가 준비된 뒤 실행 */
  function init() {
    const hasGSAP = window.gsap && window.ScrollTrigger;

    if (hasGSAP && !prefersReduced) {
      gsap.registerPlugin(ScrollTrigger);
      initReveal();
      initSloganScene();
    } else {
      // 모션을 쓰지 않을 때: 숨겨둔 요소들을 즉시 보이게
      document
        .querySelectorAll("[data-reveal], .slogan__line, .slogan__deco")
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
    }

    // 캐러셀/슬라이더는 모션 설정과 무관하게 동작 (기능성 UI)
    initWebappCarousel();
    initCompareSlider();
    initProjectImageToggle();
    initTracksyScreens();
  }

  /* -----------------------------------------------------------
     TRACKSY 폰 화면 : tracksy1~4 자동 크로스페이드
     - .tracksy-mock__screen 들 중 .is-active 한 장만 보이고
       일정 간격으로 다음 장으로 부드럽게 전환
     ----------------------------------------------------------- */
  function initTracksyScreens() {
    const screens = Array.from(document.querySelectorAll(".tracksy-mock__screen"));
    if (screens.length < 2 || prefersReduced) return; // 모션 줄이기면 첫 장 고정

    let i = 0;

    setInterval(function () {
      const prev = screens[i];
      i = (i + 1) % screens.length;
      const next = screens[i];

      /* z-index 를 고정 단계로 유지 (폰 프레임은 z-index:10 으로 항상 위):
         - 들어오는 장 next = 3 (가장 위, 단 프레임 아래)
         - 직전 장 prev = 2 (next 바로 아래에서 불투명하게 깔림 → dip 방지)
         - 나머지 = 1
         단계를 고정해 z-index 가 무한정 커져 프레임을 덮는 문제를 막습니다. */
      screens.forEach(function (s) { s.style.zIndex = "1"; });
      prev.style.zIndex = "2";
      next.style.zIndex = "3";

      /* next 를 0 → 1 로 다시 페이드인 (remove → 리플로우 → add 로 재트리거).
         next 가 투명한 동안엔 아래 prev(불투명)가 보여 배경 깜빡임이 없습니다. */
      next.classList.remove("is-active");
      void next.offsetWidth;
      next.classList.add("is-active");
    }, 1600); // 한 장당 노출 시간 (ms)
  }

  /* -----------------------------------------------------------
     1) REVEAL : 스크롤 시 등장 효과
        - [data-reveal] 요소가 화면에 들어오면 부드럽게 나타남
        - transform/opacity 만 사용 -> GPU 가속, reflow 없음
     ----------------------------------------------------------- */
  function initReveal() {
    const items = gsap.utils.toArray("[data-reveal]");

    items.forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.3,            // 더 길게 → 더 부드럽게
        ease: "power2.out",       // 완만한 감속(긴 꼬리)
        scrollTrigger: {
          trigger: el,
          start: "top 90%",       // 조금 더 일찍 시작해 여유 있게 진입
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.willChange = "auto";
        },
      });
    });
  }

  /* -----------------------------------------------------------
     2) SLOGAN SCENE : 구체가 커지고 그 안에서 텍스트가 등장
        - 섹션을 고정(pin)하고 스크롤에 맞춰(scrub) 진행
        - (1) 작은 구체가 나타나며 점점 커짐
          (2) PORTFOLIO 텍스트가 등장
          (3) 스크롤이 시작되면 스크롤 안내 아이콘은 사라짐
     ----------------------------------------------------------- */
  function initSloganScene() {
    const section = document.querySelector(".slogan");
    const stage = section ? section.querySelector(".slogan__stage") : null;
    const sphereWrap = document.querySelector(".slogan__sphere-wrap");
    const sphere = document.querySelector(".slogan__sphere");
    const text = document.querySelector(".slogan__text");
    const lines = gsap.utils.toArray(".slogan__line");
    const scrollCue = document.querySelector(".scroll-cue");
    if (!section || !sphereWrap || !sphere) return;

    // 초기 상태
    // - 구체(래퍼): 화면 중앙 정렬 + 처음 접속 시 원본 크기(scale 1)로 그대로 보임
    gsap.set(sphereWrap, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1 });
    // - 텍스트: 처음 접속 시 70px(scale 0.5)로 보였다가 140px(scale 1)로 커짐
    gsap.set(text, { scale: 0.5, transformOrigin: "center center" });
    gsap.set(lines, { opacity: 1, y: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=170%", // 고정되는 스크롤 길이 (값이 클수록 천천히 진행)
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    /* 타임라인 총 길이 = 3
       - 구체/텍스트는 끝까지 "커지면서 동시에" 서서히 사라지고,
         그 사라짐이 핀 해제(progress 1) 시점과 정확히 맞물립니다.
       - 별도의 위치 이동(점프) 없이 자연스럽게 다음 섹션으로 이어집니다. */

    // (1) 구체: 원본 크기 -> 계속 커짐 (끝까지)
    tl.to(sphereWrap, { scale: 2.8, duration: 3 }, 0);

    // (2) 텍스트: 70px(scale 0.5) -> 140px(scale 1)로 커짐 (조금 더 일찍 마무리)
    tl.to(text, { scale: 1, duration: 2 }, 0);

    // (3) 마지막 구간: 페이드아웃을 더 일찍·더 길게 빼서 끝(progress 1)까지 천천히 사라짐
    //     → 슬로건이 서서히 녹아내리며 다음(프로필) 섹션 등장과 겹치는 크로스페이드 느낌
    tl.to(sphereWrap, { opacity: 0, ease: "power1.in", duration: 1.6 }, 1.4);
    tl.to(text, { opacity: 0, ease: "power1.in", duration: 1.6 }, 1.4);

    // (4) 스크롤이 시작되면 스크롤 안내 아이콘이 먼저 사라짐
    if (scrollCue) {
      tl.to(scrollCue, { opacity: 0, y: 20, duration: 0.6 }, 0);
    }

    /* -----------------------------------------------------------
       (보너스) 툭 효과 : 마우스가 구체에 닿으면 마우스가 온 방향으로
                         살짝 툭 밀렸다가 탄성있게 제자리로 복귀
       - 커서가 원형 영역(반지름 안)으로 "들어올 때마다" 한 번씩 반응.
       - 이동(x/y)은 이미지(.slogan__sphere)에만 적용 → 스크롤 scale 과 충돌 없음.
       ----------------------------------------------------------- */
    if (stage) {
      let inside = false;

      function nudge(moveX, moveY) {
        const len = Math.hypot(moveX, moveY) || 1;
        const dist = 36; // 툭 밀리는 거리(px) — 키우면 더 크게 움직임
        gsap.killTweensOf(sphere);
        gsap.fromTo(
          sphere,
          { x: 0, y: 0 },
          {
            keyframes: [
              {
                x: (moveX / len) * dist,
                y: (moveY / len) * dist,
                duration: 0.16,
                ease: "power2.out",
              },
              {
                x: 0,
                y: 0,
                duration: 0.85,
                ease: "elastic.out(1, 0.4)",
              },
            ],
          }
        );
      }

      stage.addEventListener("pointermove", (e) => {
        const r = sphereWrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        if (Math.hypot(dx, dy) <= r.width / 2) {
          if (!inside) {
            inside = true;
            // 마우스가 들어온(이동) 방향으로 툭. 이동량이 없으면 중심→커서 방향 사용
            const mx = e.movementX || dx;
            const my = e.movementY || dy;
            nudge(mx, my);
          }
        } else {
          inside = false;
        }
      });

      stage.addEventListener("pointerleave", () => {
        inside = false;
      });
    }
  }

  /* -----------------------------------------------------------
     4) WEBAPP CAROUSEL : 썸네일/화살표로 메인 화면 전환
        - 실제 이미지는 추후 교체되므로 여기서는
          썸네일 활성화(테두리) 상태만 전환합니다.
     ----------------------------------------------------------- */
  function initWebappCarousel() {
    const thumbs = Array.from(document.querySelectorAll(".webapp__thumb"));
    const prev = document.querySelector(".webapp__nav--prev");
    const next = document.querySelector(".webapp__nav--next");
    if (!thumbs.length) return;

    let current = 0;

    function update(index) {
      current = (index + thumbs.length) % thumbs.length;
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === current));

      /* 추후 확장 지점:
         const mainImg = document.querySelector(".webapp__screen-img");
         mainImg.style.backgroundImage = "url(" + thumbsData[current] + ")";
      */
    }

    thumbs.forEach((thumb, i) =>
      thumb.addEventListener("click", () => update(i))
    );
    if (prev) prev.addEventListener("click", () => update(current - 1));
    if (next) next.addEventListener("click", () => update(current + 1));

    update(0);
  }

  /* -----------------------------------------------------------
     5) COMPARE SLIDER : Before / After 비교
        - range input 값(0~100)을 CSS 변수 --pos 로 전달
        - 마우스 드래그 + 키보드 모두 지원 (접근성)
     ----------------------------------------------------------- */
  function initCompareSlider() {
    const compare = document.querySelector(".compare");
    const range = document.querySelector(".compare__range");
    if (!compare || !range) return;

    function setPos(value) {
      compare.style.setProperty("--pos", value + "%");
    }

    range.addEventListener("input", (e) => setPos(e.target.value));
    setPos(range.value);
  }

  /* -----------------------------------------------------------
     6) PROJECT IMAGE TOGGLE : 프로젝트 Before / After 이미지 전환
        - 기본은 토글 ON(켜짐) + After(리뉴얼 후) 이미지
        - 버튼을 누르면(OFF) 같은 섹션 안의 이미지가 Before 이미지로 바뀜
     ----------------------------------------------------------- */
  function initProjectImageToggle() {
    const toggles = Array.from(document.querySelectorAll(".project-toggle"));
    if (!toggles.length) return;

    toggles.forEach((toggle) => {
      const section = toggle.closest(".project");
      const image = section && section.querySelector(".project-modoo__image");
      if (!image) return;

      const afterImage = image.dataset.afterImage;
      const beforeImage = image.dataset.beforeImage;
      const afterAlt = image.dataset.afterAlt || image.alt;
      const beforeAlt = image.dataset.beforeAlt || image.alt;
      if (!afterImage || !beforeImage) return;

      function setBefore(isBefore) {
        image.src = isBefore ? beforeImage : afterImage;
        image.alt = isBefore ? beforeAlt : afterAlt;
        // 토글 ON(pressed=true) = After(리뉴얼 후, 현재 기본 이미지)
        toggle.setAttribute("aria-pressed", String(!isBefore));
        toggle.setAttribute(
          "aria-label",
          isBefore ? "모두매쓰 After 이미지 보기" : "모두매쓰 Before 이미지 보기"
        );
      }

      toggle.addEventListener("click", () => {
        // 현재 ON(After)이면 클릭 시 Before, OFF면 After 로 전환
        setBefore(toggle.getAttribute("aria-pressed") === "true");
      });
      setBefore(false); // 기본: After 이미지 + 토글 ON(켜짐)
    });
  }

  /* -----------------------------------------------------------
     실행 순서
     - 헤더/푸터(components)가 들어온 뒤 ScrollTrigger 가 정확한
       위치를 계산할 수 있도록 "components:loaded" 이벤트를 기다립니다.
     - 보장용으로 DOMContentLoaded 시점에도 한 번 실행합니다.
     ----------------------------------------------------------- */
  /* -----------------------------------------------------------
     해시(#섹션)로 진입한 경우 처리
     - 케이스 페이지에서 "포트폴리오로 돌아가기" 등으로 #design3 같은
       앵커로 들어오면, 슬로건 섹션 pin/이미지 로드로 레이아웃 길이가
       바뀌어 브라우저의 기본 점프가 빗나갑니다(최상단으로 밀림).
     - ScrollTrigger.refresh() 로 위치 계산이 끝난 뒤, 헤더 높이만큼
       보정해 해당 섹션으로 다시 스크롤합니다.
     ----------------------------------------------------------- */
  function scrollToHashTarget() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    let target;
    try {
      target = document.querySelector(hash);
    } catch (e) {
      return;
    }
    if (!target) return;
    // 핀/이미지 로드 후 위치가 안정되도록 약간 지연한 뒤 측정
    setTimeout(() => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      const header = document.getElementById("header");
      const offset = header ? header.offsetHeight : 0;
      const y =
        target.getBoundingClientRect().top + window.pageYOffset - offset - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }, 220);
  }

  let started = false;
  function afterLoad() {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    scrollToHashTarget();
  }
  function startOnce() {
    if (started) return;
    started = true;
    init();
    if (document.readyState === "complete") {
      afterLoad();
    } else {
      window.addEventListener("load", afterLoad);
    }
  }

  document.addEventListener("components:loaded", startOnce);
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(startOnce, 600);
  });
})();
