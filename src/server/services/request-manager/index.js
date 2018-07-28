"use strict";
exports.__esModule = true;
var config_1 = require("../../config");
var modules_1 = require("../../modules");
var buildingConfig = {
    elevators: [],
    numOfFloors: 0,
    numOfElevators: 0
};
var findBestElevator = function (floor, direction) {
    var elevatorIndex = 0;
    var distanceOfElevators = [];
    buildingConfig.elevators.forEach(function (elevator, index) {
        var eleInfo = elevator.getInfo();
        var distance = Math.abs(floor - eleInfo.floor);
        distanceOfElevators.push({
            index: index,
            distance: distance
        });
    });
    // sort elevator by distance numerically
    distanceOfElevators.sort(function (a, b) { return a.distance - b.distance; });
    elevatorIndex = distanceOfElevators[0].index;
    return elevatorIndex;
};
var generateBuilding = function (socket) {
    var elevatorData = [];
    for (var i = 0; i < buildingConfig.numOfElevators; i++) {
        var rndFloor = Math.floor(Math.random() * buildingConfig.numOfFloors) + 1;
        var elevator = new modules_1.Elevator(config_1.simulatorCfg, buildingConfig, rndFloor, 0, "idle", socket);
        buildingConfig.elevators.push(elevator);
        elevatorData.push(elevator.getInfo());
    }
    socket.emit("elevators", elevatorData);
};
exports.requestManager = function (socket) {
    socket.on("building", function (data) {
        // evaluate minimum configuration
        var meetsMinimumElevators = data.numOfElevators >= config_1.simulatorCfg.minimumElevators;
        var meetsMinimumFloors = data.numOfFloors >= config_1.simulatorCfg.minimumFloors;
        var meetsMinimums = meetsMinimumElevators && meetsMinimumFloors;
        if (meetsMinimums) {
            buildingConfig.numOfFloors = data.numOfFloors;
            buildingConfig.numOfElevators = data.numOfElevators;
            buildingConfig.elevators.splice(0);
            generateBuilding(socket);
        }
    });
    socket.on("request", function (data) {
        var selectedElevator = findBestElevator(data.floor, data.direction);
        var targetFloorVal = data.targetFloors ? data.targetFloors : data.floor;
        if (targetFloorVal.indexOf(",") > -1) {
            targetFloorVal = [];
            var elevatorNumbers = data.targetFloors.split(",");
            for (var i = 0; i < elevatorNumbers.length; i++) {
                targetFloorVal.push(elevatorNumbers[i]);
            }
        }
        buildingConfig.elevators[selectedElevator].gotoFloor(targetFloorVal);
    });
};
