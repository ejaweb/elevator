(() => {
    "use strict";

    const socket = io("http://localhost:3000");
    const elevators = document.getElementById("elevators");
    const numOfFloors = document.getElementById("numOfFloors");
    const numOfElevators = document.getElementById("numOfElevators");
    const requestFloor = document.getElementById("requestFloor");
    const targetFloors = document.getElementById("targetFloors");
    const createBuildingBtn = document.getElementById("createBuildingBtn");
    const requestUpBtn = document.getElementById("requestUpBtn");
    const requestDownBtn = document.getElementById("requestDownBtn");

    createBuildingBtn.addEventListener("click", () => {
        socket.emit("building", {
            numOfFloors: numOfFloors.value,
            numOfElevators: numOfElevators.value
        });
    });

    requestUpBtn.addEventListener("click", () => {
        socket.emit("request", {
            direction: "up",
            floor: requestFloor.value,
            targetFloors: targetFloors.value,
        });
    });

    requestDownBtn.addEventListener("click", () => {
        socket.emit("request", {
            direction: "down",
            floor: requestFloor.value,
            targetFloors: targetFloors.value,
        });
    });

    socket.on("floor", (data) => {
        const parent = document.getElementById(data.elevatorID);
        const children = parent.getElementsByClassName("floor-num");
        for (var i = 0; i < children.length; i++) {
            const ele = children[i];
            ele.classList.remove("active");

            if (Number(ele.innerHTML) === Number(data.floor)) {
                ele.classList.add("active");
            }
        }
    });

    socket.on("moving", (data) => {
        const elevators = document.querySelectorAll(".elevator");
        elevators.forEach((ele) => {
            ele.classList.remove("moving");
        });

        const parent = document.getElementById(data.elevatorID);
        parent.classList.add("moving");
    });

    socket.on("elevators", (data) => {
        elevators.innerHTML = "";

        for (var i = 0; i < data.length; i++) {
            let elevatorHTML = `<div class="elevator" id="${data[i].elevatorID}">`;

            for (var j = 0; j < data[i].numOfFloors; j++) {
                elevatorHTML += `<span class="floor-num ${data[i].floor === j + 1 ? "active" : ""}">${j + 1}</span>`;
            }

            elevatorHTML += "</div>";
            elevators.innerHTML += elevatorHTML;
        }
    });
})();