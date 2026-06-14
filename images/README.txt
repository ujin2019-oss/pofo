이 폴더에 실제 이미지를 넣으세요.

[교체 방법]
HTML 안의 빈 슬롯은 아래처럼 생겼습니다:

  <div class="img-slot" role="img" aria-label="...">
    <span class="img-slot__label">IMAGE</span>
  </div>

방법 1) img 태그로 교체
  <img src="./images/내이미지.jpg" alt="설명" />

방법 2) 슬롯 그대로 두고 배경 이미지만 지정
  <div class="img-slot" style="background-image:url('./images/내이미지.jpg'); background-size:cover;"></div>

* 비율(가로:세로)은 각 슬롯에 이미 맞춰져 있으니 같은 비율 이미지를 넣으면 깔끔합니다.
