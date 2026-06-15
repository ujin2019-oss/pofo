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
     2) SLOGAN SCENE : 구체가 커지고 그 안에서 텍스트가 등장
        - 섹션을 고정(pin)하고 스크롤에 맞춰(scrub) 진행
        - (1) 작은 구체가 나타나며 점점 커짐
          (2) PORTFOLIO 텍스트가 등장
          (3) 스크롤이 시작되면 스크롤 안내 아이콘은 사라짐
     ----------------------------------------------------------- */
  function initSloganScene() {
    const section = document.querySelector(".slogan");
    const sphere = document.querySelector(".slogan__sphere");
    const text = document.querySelector(".slogan__text");
    const lines = gsap.utils.toArray(".slogan__line");
    const scrollCue = document.querySelector(".scroll-cue");
    if (!section || !sphere) return;

    // 초기 상태
    // - 구체: 화면 중앙 정렬 + 처음 접속 시 원본 크기(scale 1)로 그대로 보임
    gsap.set(sphere, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1 });
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
    tl.to(sphere, { scale: 2.8, duration: 3 }, 0);

    // (2) 텍스트: 70px(scale 0.5) -> 140px(scale 1)로 커짐 (조금 더 일찍 마무리)
    tl.to(text, { scale: 1, duration: 2 }, 0);

    // (3) 마지막 구간: 커지는 동안 그대로 페이드아웃 -> 끝(progress 1)에 완전히 사라짐
    //     위치 이동 없이 제자리에서 사라져 다음 섹션과 부드럽게 크로스됨
    tl.to(sphere, { opacity: 0, ease: "power2.in", duration: 1.1 }, 1.9);
    tl.to(text, { opacity: 0, ease: "power2.in", duration: 1.1 }, 1.9);

    // (4) 스크롤이 시작되면 스크롤 안내 아이콘이 먼저 사라짐
    if (scrollCue) {
      tl.to(scrollCue, { opacity: 0, y: 20, duration: 0.6 }, 0);
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
        - 기본은 After 이미지
        - 버튼을 누르면 같은 섹션 안의 이미지가 Before 이미지로 바뀜
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
        toggle.setAttribute("aria-pressed", String(isBefore));
        toggle.setAttribute(
          "aria-label",
          isBefore ? "모두매쓰 After 이미지 보기" : "모두매쓰 Before 이미지 보기"
        );
      }

      toggle.addEventListener("click", () => {
        setBefore(toggle.getAttribute("aria-pressed") !== "true");
      });
      setBefore(false);
    });
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
