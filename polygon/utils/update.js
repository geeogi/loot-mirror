"use strict";
exports.__esModule = true;
exports.sendOwnerUpdates = void 0;
var ethers_1 = require("ethers");
var fs = require("fs");
var constants_1 = require("./constants");
var sendOwnerUpdates = function (polygonProvider, ownerUpdates) {
    var contract = new ethers_1.ethers.Contract(constants_1.LOOT_MIRROR_ADDRESS, constants_1.LOOT_MIRROR_ABI, polygonProvider);
    var wallet = new ethers_1.ethers.Wallet(constants_1.PRIVATE_KEY, polygonProvider);
    var signer = contract.connect(wallet);
    if (!process.env.CI) {
        fs.writeFile("./output/ownerUpdates-" + Date.now() + ".json", JSON.stringify(ownerUpdates, null, 2), "utf8", function () { });
    }
    if (process.env.CI) {
        if (ownerUpdates.length > 0) {
            console.log("sending tx to LootMirror");
            var options = {
                gasLimit: 10000000,
                gasPrice: ethers_1.ethers.utils.parseUnits("10.0", "gwei")
            };
            signer
                .setLootOwners(ownerUpdates, options)
                .then(function (tx) {
                console.log("tx sent: " + tx.hash);
                tx.wait()
                    .then(function (receipt) {
                    console.log("status: " + receipt.status);
                })["catch"](function (e) {
                    console.log(e);
                    throw new Error(e);
                });
            })["catch"](function (e) {
                console.log(e);
                throw new Error(e);
            });
        }
    }
};
exports.sendOwnerUpdates = sendOwnerUpdates;
