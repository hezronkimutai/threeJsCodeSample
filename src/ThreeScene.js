import React, { Component } from "react";
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";
import Stats from "stats-js";
import { Font } from "three";
import FontJson from "./font/helvetiker_bold.typeface.json";
import { MTLLoader, OBJLoader } from "three-obj-mtl-loader";
import GLTFLoader from "three-gltf-loader";
import { getMirror, getLensFlare, getTextMesh } from "./helper/MeshHelper";
import { moveToCenter, generateTexture, normalize } from "./helper/NoiseHelper";
//Textures
const ANGULAR_VELOCITY = 0.01;
const BACKGROUND = "./assets/skybox.jpg";

var camera;
var shaderMaterial, lineMaterial;
var orbit; // light orbit
var helvatiker;
var mainGroup;
var shouldAnimate;
var controls;
var delta = 0;

//FPS stats
var statsFPS = new Stats();
statsFPS.domElement.style.cssText = "position:absolute;top:3px;left:3px;";
statsFPS.showPanel(0); // 0: fps,

//Memory stats
var statsMemory = new Stats();
statsMemory.showPanel(2); //2: mb, 1: ms, 3+: custom
statsMemory.domElement.style.cssText = "position:absolute;top:3px;left:84px;";

//Shader Basic Uniforms
var customUniforms = {
  delta: { value: 0 },
  u_time: { type: "f", value: 0 },
  u_resolution: { type: "v2", value: new THREE.Vector2(1280, 720) },
  u_mouse: { type: "v2", value: new THREE.Vector2(0, 0) }
};

/**
 * Example temnplate of using Three with React
 */
class ThreeScene extends Component {
  constructor(props) {
    super(props);
    this.state = { useWireFrame: false };
  }

  animate = () => {
    //update Orbit Of Camera
    controls.update();

    //Animate rotation of light
    if (orbit) orbit.rotation.z += ANGULAR_VELOCITY;

    //Update stats
    statsFPS.update();
    statsMemory.update();

    // Update Uniform of shader
    delta += 0.01;
    customUniforms.delta.value = 0.5 + Math.sin(delta) * 0.0005;
    customUniforms.u_time.value = delta;
    //Direct manipulation
    //shaderMaterial.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.0005;
    //shaderMesh.material.uniforms.u_time.value = delta;

    //Redraw scene
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  };

  componentDidMount() {
    //Add Light & nCamera
    this.addScene();

    //Lens Flare
    this.scene.add(getLensFlare());

    // Mirror
    let verticalMirror = getMirror();
    verticalMirror.rotation.y = Math.PI / 2;
    verticalMirror.position.x = -100;
    this.scene.add(verticalMirror);

    //add stats for FPS and Memory usage
    document.body.appendChild(statsFPS.dom);
    document.body.appendChild(statsMemory.dom);

    // // Add Box Mesh with shader as texture
    this.addModels();

    //add Title
    this.addTitle("Three Template");

    // Add Events
    window.addEventListener("resize", this.onWindowResize, false);
    document.addEventListener("keyup", this.onDocumentKeyUp, false);
    document.addEventListener("keydown", this.onDocumentKeyDown, false);
    document.addEventListener("mousemove", this.onDocumentMouseMove, false);

    //--------START ANIMATION-----------
    this.renderScene();
    this.start();
  }

  /**
   * Load and Display OBJ Model
   */
  loadObjModel = (materialURL, objectURL) => {
    new MTLLoader().load(materialURL, materials => {
      materials.preload();
      //materials.Material.side = THREE.DoubleSide;
      console.log("Loaded Materials");
      var objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(
        objectURL,
        object => {
          //const root = object.detail.loaderRootNode;
          console.log("Loaded Obj" + object);
          let mesh = object;
          this.scene.add(object);
          mesh.position.set(0, 0, 0);
          mesh.scale.set(0.07, 0.07, 0.07);
        },
        xhr => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        error => {
          console.log("An error happened" + error);
        }
      );
    });
  };

  /**
   * Load GLTF model with animations
   */
  loadGttfModel = gtlfUrl => {
    // MODEL
    new GLTFLoader().load(
      gtlfUrl,
      gltf => {
        let gltfMesh = gltf.scene;

        gltfMesh.traverse(node => {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.material.side = THREE.DoubleSide;
          }
        });

        gltfMesh.scale.set(0.1, 0.1, 0.1);
        gltfMesh.position.set(0, 10, -2);
        this.scene.add(gltfMesh);

        // animations = gltf.animations;
        // console.log(animations);

        // mixer = new THREE.AnimationMixer(sonicMesh);
        // mixer.clipAction(gltf.animations[currentAnimation]).play();
        // this.start();
      },
      undefined,
      e => {
        console.error(e);
      }
    );
  };

  addModels = () => {
    // Create and set shader Material
    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: customUniforms,
      side: THREE.DoubleSide,
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
      depthWrite: false,
      depthTest: false,
      transparent: true
    });

    //this.loadObjModel("./assets/windmill-fixed.mtl", "./assets/windmill.obj");
    // this.loadObjModel("./assets/coconut-tree.mtl", "./assets/coconut-tree.obj");
    //this.loadGttfModel("./assets/tree.gltf");

    // parent group to hold models
    mainGroup = new THREE.Object3D();
    this.scene.add(mainGroup);

    // Add Box Mesh with shader as texture
    var boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100, 8);
    let cubeMesh = new THREE.Mesh(boxGeometry, shaderMaterial);
    cubeMesh.position.x = 0;
    cubeMesh.position.y = 0;
    cubeMesh.rotation.z = -Math.PI / 2;
    // TextMaterial
    lineMaterial = new THREE.LineBasicMaterial({
      color: "#0f0",
      linewidth: 1
    });

    //Add wireframe
    var wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeometry),
      lineMaterial
    );
    cubeMesh.add(wireframe);
    mainGroup.add(cubeMesh);
  };

  /**
   * Add a Title to scene
   */
  addTitle = title => {
    // add Title
    helvatiker = new Font(FontJson);
    let textMesh = getTextMesh(title, lineMaterial, helvatiker);
    textMesh.position.y = 150;
    this.scene.add(textMesh);
    moveToCenter(textMesh);
  };

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };
  stop = () => {
    cancelAnimationFrame(this.frameId);
  };

  renderScene = () => {
    if (this.renderer) this.renderer.render(this.scene, camera);
  };

  componentWillUnmount() {
    this.stop();
    document.removeEventListener("mousemove", this.onDocumentMouseMove, false);
    window.removeEventListener("resize", this.onWindowResize, false);
    document.removeEventListener("keydown", this.onDocumentKeyDown, false);
    document.removeEventListener("keyup", this.onDocumentKeyUp, false);
    this.mount.removeChild(this.renderer.domElement);
  }

  onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Update Shader
    customUniforms.u_resolution.value.x = this.renderer.domElement.width;
    customUniforms.u_resolution.value.y = this.renderer.domElement.height;
    // shaderMaterial2.uniforms.u_resolution.value = new THREE.Vector2(
    //   window.innerWidth,
    //   window.innerHeight
    // );
  };

  onDocumentMouseMove = event => {
    event.preventDefault();

    if (event && typeof event !== undefined) {
      // update normalized Uniform
      let x = (event.clientX / window.innerWidth) * 2 - 1;
      let y = -(event.clientY / window.innerHeight) * 2 + 1;
      customUniforms.u_mouse.value.x = x; // event.pageX;
      customUniforms.u_mouse.value.y = y; // event.pageY;

      // update Uniform directly
      //shaderMaterial1.uniforms.u_mouse.value = new THREE.Vector2(x, y);
    }
  };

  onDocumentKeyDown = event => {
    shouldAnimate = false;
    var keyCode = event.which;
    switch (keyCode) {
      case 87: {
        // shaderMesh1.rotation.x += ROTATION_ANGLE; //W
        console.log("OnKeyPress W");
        mainGroup.rotation.y += 0.1;
        break;
      }
      case 83: {
        // shaderMesh1.rotation.x -= ROTATION_ANGLE; //S
        console.log("OnKeyPress S");
        mainGroup.rotation.y -= 0.1;
        break;
      }
      case 65: {
        //shaderMesh1.rotation.y -= ROTATION_ANGLE; //A
        console.log("OnKeyPress A");
        break;
      }
      case 68: {
        //shaderMesh1.rotation.y -= ROTATION_ANGLE; //D
        console.log("OnKeyPress D");
        break;
      }
      case 32: {
        console.log("OnKeyPress SPACE");
        break;
      }
      default: {
        break;
      }
    }
  };
  onDocumentKeyUp = event => {
    var keyCode = event.which;
    shouldAnimate = true;
    console.log("onKey Up " + keyCode);
  };

  /**
   * Boilder plate to add LIGHTS, Renderer, Axis, Grid,
   */
  addScene = () => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    this.scene = new THREE.Scene();

    // ------- Add RENDERED ------
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#263238");
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement);

    // -------Add CAMERA ------
    camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 100000);
    camera.position.z = 200;
    camera.position.y = 200;
    camera.position.x = 200;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //------ Add SKYBOX ------
    let panaromaTexture = new THREE.TextureLoader().load(BACKGROUND);
    panaromaTexture.magFilter = THREE.LinearFilter;
    panaromaTexture.minFilter = THREE.LinearFilter;

    //create background material using texture
    const shader = THREE.ShaderLib.equirect;
    const bgMaterial = new THREE.ShaderMaterial({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
    });

    bgMaterial.uniforms.tEquirect.value = panaromaTexture;
    const bgBox = new THREE.BoxBufferGeometry(10000, 10000, 10000);

    let bgMesh = new THREE.Mesh(bgBox, bgMaterial);
    this.scene.add(bgMesh);

    //------Add Fog--------
    //this.scene.fog = new THREE.Fog(0xffffff, 2, 2);

    //------Add ORBIT CONTROLS--------
    controls = new OrbitControls(camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.keys = {
      LEFT: 37, //left arrow
      UP: 38, // up arrow
      RIGHT: 39, // right arrow
      BOTTOM: 40 // down arrow
    };

    controls.addEventListener("change", () => {
      if (this.renderer) this.renderer.render(this.scene, camera);
    });

    //-------------LIGHTS------------------
    // Spining point light
    orbit = new THREE.Group(); // orbit of light

    //SUN LIGHT
    var sunGeometry = new THREE.SphereBufferGeometry(7, 8, 128);
    var sunLight = new THREE.PointLight(0xfafacf, 2, 0);
    var sunMat = new THREE.MeshStandardMaterial({
      emissive: 0xffee88,
      emissiveIntensity: 1,
      color: 0xffee88
    });
    sunLight.add(new THREE.Mesh(sunGeometry, sunMat));
    sunLight.position.set(0, 250, 0);
    sunLight.castShadow = true;
    orbit.add(sunLight);

    //MOON LIGHT
    var moonGeometry = new THREE.SphereBufferGeometry(2, 8, 128);
    var moonLight = new THREE.PointLight(0xc2c5cc, 1.5, 0);
    var moonMat = new THREE.MeshStandardMaterial({
      emissive: 0xc2c5cc,
      emissiveIntensity: 1,
      color: 0xc2c5cc
    });
    moonLight.add(new THREE.Mesh(moonGeometry, moonMat));
    moonLight.position.set(0, -250, 0);
    moonLight.castShadow = true;
    orbit.add(moonLight);
    this.scene.add(orbit);

    // background Sun light
    var bgLight = new THREE.SpotLight(0xffffff, 0.1, 0, Math.PI / 2);
    bgLight.position.set(0, 200, 0);
    bgLight.castShadow = true;
    bgLight.shadow.bias = -0.0002;
    bgLight.shadow.camera.far = 4000;
    bgLight.shadow.camera.near = 750;
    bgLight.shadow.camera.fov = 30;
    this.scene.add(bgLight);

    this.addHelper();
  };
  //-------------HELPER------------------
  addHelper = () => {
    // Add Grid
    let gridXZ = new THREE.GridHelper(
      800,
      4,
      0x18ffff, //center line color
      0x42a5f5 //grid color,
    );
    this.scene.add(gridXZ);
    gridXZ.position.y = 0;

    // // Add AXiS
    let axesHelper = new THREE.AxesHelper(299);
    axesHelper.position.y = 10;
    this.scene.add(axesHelper);
  };
  render() {
    return (
      <div
        style={{ width: window.innerWidth, height: window.innerHeight }}
        ref={mount => {
          this.mount = mount;
        }}
      />
    );
  }
}
export default ThreeScene;
