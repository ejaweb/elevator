"use strict";
exports.__esModule = true;
var Elevator = /** @class */ (function () {
    // shorthand constructor
    function Elevator(config, buildingConfig, floor, trips, direction, socket) {
        if (floor === void 0) { floor = 1; }
        if (trips === void 0) { trips = 0; }
        if (direction === void 0) { direction = "idle"; }
        this.config = config;
        this.buildingConfig = buildingConfig;
        this.floor = floor;
        this.trips = trips;
        this.direction = direction;
        this.socket = socket;
        this.moving = false;
        this.service = false;
        this.elevatorID = "";
        this.numOfFloors = 0;
        this.numOfElevators = 0;
        this.elevatorQueue = [];
        this.socket = socket ? socket : false;
        this.elevatorID = Math.random().toString(36).substr(2, 9);
        this.numOfFloors = buildingConfig.numOfFloors;
        this.numOfElevators = buildingConfig.numOfElevators;
    }
    Elevator.prototype.getInfo = function () {
        return {
            floor: this.floor,
            trips: this.trips,
            direction: this.direction,
            moving: this.moving,
            service: this.service,
            elevatorID: this.elevatorID,
            numOfFloors: this.numOfFloors,
            numOfElevators: this.numOfElevators
        };
    };
    Elevator.prototype.gotoFloor = function (floor) {
        var _this = this;
        if (Array.isArray(floor)) {
            // unique id used to know which groups to group
            var uid_1 = Math.random().toString(36).substr(2, 9);
            floor.forEach(function (val) {
                _this.elevatorQueue.push({ floor: val, uid: uid_1 });
            });
        }
        else {
            this.elevatorQueue.push({ floor: floor });
        }
        // initialize our elevator
        this.moveElevator();
    };
    Elevator.prototype.resetElevator = function () {
        this.moving = false;
        this.direction = "idle";
        this.elevatorQueue.shift();
        // continue elevator queue
        if (this.elevatorQueue.length > 0) {
            if (this.elevatorQueue[0].uid) {
                console.log("\nDROP OFF COMPLETE, NEXT FLOOR (GROUP) BEING CALCULATED...");
            }
            else {
                console.log("\nDROP OFF COMPLETE, NEXT FLOOR: " + this.elevatorQueue[0].floor + "...");
            }
            this.moveElevator();
        }
        else {
            console.log("\nDROP OFF COMPLETE, ELEVATOR IDLE!\n");
        }
    };
    Elevator.prototype.moveElevator = function () {
        var _this = this;
        // queue one request at a time
        if (!this.moving) {
            this.emitMoving();
            this.moving = true;
            var elevatorQueueGroup = [];
            // determine if single or grouped request
            if (this.elevatorQueue[0].uid) {
                // lets group all grouped members by uid
                for (var i = 0; i < this.elevatorQueue.length; i++) {
                    var queueGroup = this.elevatorQueue[i];
                    if (queueGroup.uid === this.elevatorQueue[0].uid) {
                        elevatorQueueGroup.push(queueGroup);
                    }
                }
            }
            // elevator order priority algorithm
            if (elevatorQueueGroup.length > 0) {
                var upGroup = [];
                var downGroup = [];
                // first, we sort group numerically
                elevatorQueueGroup.sort(function (a, b) { return a.floor - b.floor; });
                // second, we delete the old queue order
                // and order them according to priority
                for (var i = 0; i < elevatorQueueGroup.length; i++) {
                    this.elevatorQueue.shift();
                    var queue = elevatorQueueGroup[i];
                    // avoid reprocessing group
                    delete queue.uid;
                    // we prioritize moving the elevator up
                    if (queue.floor > this.floor) {
                        upGroup.push(queue);
                    }
                    else {
                        downGroup.push(queue);
                    }
                }
                // loop forwards and add them to the front in descending order
                for (var i = 0; i < downGroup.length; i++) {
                    this.elevatorQueue.unshift(downGroup[i]);
                }
                // loop backwards and add them to the front in ascending order
                for (var i = upGroup.length - 1; i >= 0; i--) {
                    this.elevatorQueue.unshift(upGroup[i]);
                }
                // free up some memory
                elevatorQueueGroup.splice(0);
            }
            // can't go above or below set number of floors
            if ((this.elevatorQueue[0].floor <= 0) || (this.elevatorQueue[0].floor > this.numOfFloors)) {
                console.log("\nElevator cannot access that floor!\n");
                this.resetElevator();
                return;
            }
            // check if elevator is on existing floor
            if (this.elevatorQueue[0].floor === this.floor) {
                console.log("\nElevator is on the same floor!\n");
                this.resetElevator();
                return;
            }
            // check if elevator requires service
            if (this.serviceCheck()) {
                console.log("\nElevator needs to be serviced!\n");
                return;
            }
            // determine direction and amount to move up or down
            var direction = this.elevatorQueue[0].floor > this.floor ? "up" : "down";
            var countUp = this.elevatorQueue[0].floor - this.floor;
            var countDown = this.floor - this.elevatorQueue[0].floor;
            var count_1 = direction === "up" ? countUp : countDown;
            // helper function to check for last iterator
            var isLastFloor_1 = function (i) {
                _this.emitFloor();
                if (i === count_1) {
                    console.log("\nDROPPING OFF GUEST ON FLOOR " + _this.elevatorQueue[0].floor + " ...\n");
                    setTimeout(function () {
                        _this.trips++;
                        _this.resetElevator();
                    }, _this.config.elevatorDropoffSpeedMS);
                }
            };
            var _loop_1 = function (i) {
                var speed = i * this_1.config.elevatorTransitSpeedMS;
                this_1.direction = direction;
                if (direction === "up") {
                    setTimeout(function () {
                        _this.floor++;
                        isLastFloor_1(i);
                    }, speed);
                }
                else {
                    setTimeout(function () {
                        _this.floor--;
                        isLastFloor_1(i);
                    }, speed);
                }
            };
            var this_1 = this;
            // move the elevator properly through the floors
            for (var i = 1; i < count_1 + 1; i++) {
                _loop_1(i);
            }
        }
    };
    Elevator.prototype.serviceCheck = function () {
        if (this.trips >= this.config.maxTrips) {
            this.service = true;
            this.emitService();
        }
        return this.service;
    };
    Elevator.prototype.emitFloor = function () {
        if (this.socket) {
            this.socket.emit("floor", this.getInfo());
        }
    };
    Elevator.prototype.emitMoving = function () {
        if (this.socket) {
            this.socket.emit("moving", this.getInfo());
        }
    };
    Elevator.prototype.emitService = function () {
        if (this.socket) {
            this.socket.emit("service", this.getInfo());
        }
    };
    return Elevator;
}());
exports.Elevator = Elevator;
