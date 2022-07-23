import * as THREE from "three";
import { Lensflare, LensflareElement } from "../effects/LensFlare";
import { Reflector } from "../effects/Reflector";

/**  --------- Generate Text mesh---------**/
export const getTextMesh = (text, material, customFont) => {
  //Number
  let textgeometry = new THREE.TextBufferGeometry(
    text,
    Object.assign(
      {},
      {
        font: customFont,
        curveSegments: 8,
        height: 1,
        size: 45
      }
    )
  );
  return new THREE.Mesh(textgeometry, material);
};

/**  --------- Generate Lens Flare Effect ---------**/
export const getLensFlare = () => {
  var spotLight0 = new THREE.SpotLight(0xcccccc);
  spotLight0.castShadow = true;
  // spotLight0.lookAt(plane);

  //    var spotLight = new THREE.SpotLight( pointColor);
  var spotLight = new THREE.DirectionalLight("#ffffff");
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 0.1;
  spotLight.shadow.camera.far = 1000;
  spotLight.shadow.camera.fov = 50;
  spotLight.distance = 0;
  spotLight.shadow.camera.near = 2;
  spotLight.shadow.camera.far = 200;
  spotLight.shadow.camera.left = -100;
  spotLight.shadow.camera.right = 100;
  spotLight.shadow.camera.Top = 100;
  spotLight.shadow.camera.bottom = -100;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;

  var textureLoader = new THREE.TextureLoader();

  var textureFlare0 = textureLoader.load("./assets/lensflare0.png");
  var textureFlare1 = textureLoader.load("./assets/lensflare2.png");
  var textureFlare3 = textureLoader.load("./assets/lensflare3.png");

  var flareColor = new THREE.Color(0xffaacc);

  var lensFlare = new Lensflare();

  lensFlare.addElement(
    new LensflareElement(textureFlare0, 350, 0.0, flareColor)
  );
  lensFlare.addElement(
    new LensflareElement(textureFlare3, 60, 0.6, flareColor)
  );
  lensFlare.addElement(
    new LensflareElement(textureFlare3, 70, 0.7, flareColor)
  );
  lensFlare.addElement(
    new LensflareElement(textureFlare3, 120, 0.9, flareColor)
  );
  lensFlare.addElement(
    new LensflareElement(textureFlare3, 70, 1.0, flareColor)
  );
  spotLight.add(lensFlare);
  spotLight.add(spotLight0);

  //this.scene.add(spotLight);
  return spotLight;
};

/**  ---------  Create Reflective Mirror surface---- **/
export const getMirror = () => {
  //scene size
  var WIDTH = window.innerWidth;
  var HEIGHT = window.innerHeight;

  var geometry = new THREE.PlaneBufferGeometry(100, 100);
  var verticalMirror = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: WIDTH * window.devicePixelRatio,
    textureHeight: HEIGHT * window.devicePixelRatio,
    color: 0x889999,
    recursion: 0
  });
  //   verticalMirror.rotation.y = Math.PI / 2;
  //   verticalMirror.position.x = -100;
  //   this.scene.add(verticalMirror);

  return verticalMirror;
};
