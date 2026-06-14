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
      initHeroExit();
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
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.willChange = "auto";
        },
      });
    });
  }

  /* -----------------------------------------------------------
     2) HERO EXIT : 1번 Hero 가 위로 빠질 때 자연스럽게 사라짐
        - 스크롤(scrub)에 맞춰 PORTFOLIO 글자는 위로 페이드아웃,
          원형 이미지는 점점 작아지며 사라져 2번 구체로 이어집니다.
     ----------------------------------------------------------- */
  function initHeroExit() {
    const hero = document.querySelector(".hero");
    const title = document.querySelector(".hero__title");
    const visual = document.querySelector(".hero__visual");
    if (!hero) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top", // Hero 가 화면에서 빠지는 구간 전체
        scrub: 1,
      },
    });

    if (title) tl.to(title, { y: -100, opacity: 0, ease: "none" }, 0);
    // 스크롤을 내리면 원형 이미지가 점점 작아지며 사라짐
    if (visual) tl.to(visual, { scale: 0.35, opacity: 0, ease: "none" }, 0);
  }

  /* -----------------------------------------------------------
     3) SLOGAN SCENE : 구체가 커지고 그 안에서 텍스트가 등장
        - 섹션을 고정(pin)하고 스크롤에 맞춰(scrub) 진행
        - (1) 작은 구체가 나타나며 점점 커짐
          (2) BEYOND BEAUTY / TO THE / ESSENCE 가 순서대로 등장
          (3) 텍스트 아래 세로 라인이 그려짐
     ----------------------------------------------------------- */
  function initSloganScene() {
    const section = document.querySelector(".slogan");
    const sphere = document.querySelector(".slogan__sphere");
    const lines = gsap.utils.toArray(".slogan__line");
    const deco = document.querySelector(".slogan__deco");
    if (!section || !sphere) return;

    // 초기 상태
    // - 구체: 화면 중앙 정렬(xPercent/yPercent) + 작게/투명하게 시작
    gsap.set(sphere, { xPercent: -50, yPercent: -50, scale: 0.45, opacity: 0 });
    gsap.set(lines, { y: 40, opacity: 0 });
    if (deco) {
      gsap.set(deco, { scaleY: 0, opacity: 0, transformOrigin: "top center" });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=200%", // 고정되는 스크롤 길이 (값이 클수록 천천히 진행)
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    // (1) 구체 등장 -> 점점 커짐
    tl.to(sphere, { opacity: 1, scale: 1, ease: "none", duration: 1 }, 0);
    tl.to(sphere, { scale: 1.5, ease: "none", duration: 2.2 }, 1);

    // (2) 텍스트가 구체 안에서 순서대로 등장
    tl.to(
      lines,
      { y: 0, opacity: 1, stagger: 0.3, ease: "none", duration: 1.4 },
      1.2
    );

    // (3) 세로 데코 라인이 그려짐
    if (deco) {
      tl.to(deco, { scaleY: 1, opacity: 1, ease: "none", duration: 1 }, 2);
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
     실행 순서
     - 헤더/푸터(components)가 들어온 뒤 ScrollTrigger 가 정확한
       위치를 계산할 수 있도록 "components:loaded" 이벤트를 기다립니다.
     - 보장용으로 DOMContentLoaded 시점에도 한 번 실행합니다.
     ----------------------------------------------------------- */
  let started = false;
  function startOnce() {
    if (started) return;
    started = true;
    init();
    if (window.ScrollTrigger) {
      window.addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  document.addEventListener("components:loaded", startOnce);
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(startOnce, 600);
  });
})();
