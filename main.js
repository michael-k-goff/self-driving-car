// Project based on the library-free self-driving car Javascript by Rado Mariescu-Istodor
// See his deployment: https://radufromfinland.com/projects/selfdrivingcar/
// YouTube: https://www.youtube.com/watch?v=Rs_rAxEsAvI

// Several pre-defined parameter sets to have data in one place.
const param_set = {
    "short":{ // Mostly for testing. Not generally enough to learn a good network.
        "num_iterations":5,
        "iteration_length":1000,
        "number_cars":100
    },
    "long":{ // Often, but not always, enough to learn a good network.
        "num_iterations":30,
        "iteration_length":5000,
        "number_cars":100
    }
}
const params = param_set["long"];

const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;
let best_score = 9999;
let best_brain = null; // Best brain found so far, if any.

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

let road;
let car;
let cars;
let bestCar;
let traffic;

road = new Road(carCanvas.width/2, carCanvas.width*0.9);

function initialize() {
    //car = new Car(road.getLaneCenter(1),100,30,50,"AI");
    cars = generateCars(params["number_cars"]);
    bestCar = cars[0];

    if (best_brain) {
        for (let i=0; i<cars.length; i++) {
            cars[i].brain = JSON.parse(best_brain)
            if (i != 0) {
                NeuralNetwork.mutate(cars[i].brain, 0.2);
            }
        }
    }

    if (localStorage.getItem("bestBrain") && 1==0) { // Skip this step of loading a brain at the start
        for (let i=0; i<cars.length; i++) {
            cars[i].brain = JSON.parse(
                localStorage.getItem("bestBrain")
            )
            if (i != 0) {
                NeuralNetwork.mutate(cars[i].brain, 0.2);
            }
        }
    }
    traffic = [
        new Car(road.getLaneCenter(1), -100,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(0), -300,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(2), -300,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(0), -500,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(1), -500,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(1), -700,30,50,'DUMMY',2),
        new Car(road.getLaneCenter(2), -700,30,50,'DUMMY',2)
    ];
}

initialize();
// These iterations seek to build a good network and are not displayed.
for (let i=0; i<params["num_iterations"]; i++) {
    quickAnimation(params["iteration_length"], i);
}

// The last iteration. It is displayed.
animate();

function save() { // Loading is presently disabled, making this function moot.
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain)
    );
}

function discard() { // Loading is presently disabled, making this function moot.
    localStorage.removeItem("bestBrain");
}

function update_brain() {
    best_brain = JSON.stringify(bestCar.brain);
    for (let i=0; i<cars.length; i++) {
        cars[i].brain = JSON.parse(best_brain)
        if (i != 0) {
            NeuralNetwork.mutate(cars[i].brain, 0.2);
        }
    }
}

function generateCars(N) {
    carsx = [];
    for (let i=1; i<=N; i++) {
        carsx.push(new Car(road.getLaneCenter(1), 100,30,50,"AI"));
    }
    return carsx;
}

function animate(time) {
    for (let i=0; i<traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }
    for (let i=0; i<cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }
    bestCar = cars.find(
        c=>c.y == Math.min(
            ...cars.map(c => c.y)
        )
    );

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for (let i=0; i<traffic.length; i++) {
        traffic[i].draw(carCtx,"red");
    }
    carCtx.globalAlpha = 0.2;
    for (let i=0; i<cars.length; i++) {
        cars[i].draw(carCtx,"blue");
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx,"blue",true);

    carCtx.restore();

    networkCtx.lineDashOffset = -time/50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}

// Some functions to quickly speed through simulations.

function quickAnimation(frames, cycle_number) {
    for (let i=0; i<frames; i++) {
        quickAnimationFrame();
    }
    bestCar = cars.find(
        c=>c.score == Math.min(
            ...cars.map(c => c.score)
        )
    );
    if (bestCar.score < best_score) {
        update_brain();
        best_score = bestCar.score;
    }
    console.log("Cycle number: "+cycle_number+", Best score: "+best_score);
    initialize();
}

function quickAnimationFrame() {
    for (let i=0; i<traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }
    for (let i=0; i<cars.length; i++) {
        cars[i].update(road.borders, traffic);
        calculateScore(cars[i]);
    }
}

function calculateScore(car) {
    let score = car.y - traffic[0].y;
    car.score = (score < car.score) ? car.y - traffic[0].y : car.score;
}