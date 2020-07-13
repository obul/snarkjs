import * as snarkjs from "../main.js";
import { getCurveFromName } from "../src/curves.js";
import assert from "assert";
import path from "path";

describe("Full process", function ()  {
    this.timeout(100000);

    let curve;
    const ptau_0 = {type: "mem"};
    const ptau_1 = {type: "mem"};
    const ptau_2 = {type: "mem"};
    const ptau_beacon = {type: "mem"};
    const ptau_final = {type: "mem"};
    const ptau_challange2 = {type: "mem"};
    const ptau_response2 = {type: "mem"};
    const zkey_0 = {type: "mem"};
    const zkey_1 = {type: "mem"};
    const zkey_2 = {type: "mem"};
    const zkey_final = {type: "mem"};
    const bellman_1 = {type: "mem"};
    const bellman_2 = {type: "mem"};
    let vKey;
    const wtns = {type: "mem"};
    let proof;
    let publicSignals;

    before( async () => {
        curve = await getCurveFromName("bn128");
    });
    after( async () => {
        await curve.terminate();
    });

    it ("powersoftau new", async () => {
        await snarkjs.powersOfTau.newAccumulator(curve, 12, ptau_0);
    });

    it ("powersoftau contribute ", async () => {
        await snarkjs.powersOfTau.contribute(ptau_0, ptau_1, "C1", "Entropy1");
    });

    it ("powersoftau export challange", async () => {
        await snarkjs.powersOfTau.exportChallange(ptau_1, ptau_challange2);
    });

    it ("powersoftau challange contribute", async () => {
        await snarkjs.powersOfTau.challangeContribute(curve, ptau_challange2, ptau_response2, "Entropy2");
    });

    it ("powersoftau import response", async () => {
        await snarkjs.powersOfTau.importResponse(ptau_1, ptau_response2, ptau_2, "C2");
    });

    it ("powersoftau beacon", async () => {
        await snarkjs.powersOfTau.beacon(ptau_2, ptau_beacon, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
    });

    it ("powersoftau prepare phase2", async () => {
        await snarkjs.powersOfTau.preparePhase2(ptau_beacon, ptau_final);
    });

    it ("powersoftau verify", async () => {
        const res = await snarkjs.powersOfTau.verify(ptau_final);
        assert(res);
    });

    it ("zkey new", async () => {
        await snarkjs.zKey.newZKey(path.join("test", "circuit", "circuit.r1cs"), ptau_final, zkey_0);
    });

    it ("zkey contribute ", async () => {
        await snarkjs.zKey.contribute(zkey_0, zkey_1, "p2_C1", "pa_Entropy1");
    });

    it ("zkey export bellman", async () => {
        await snarkjs.zKey.exportBellman(zkey_1, bellman_1);
    });

    it ("zkey bellman contribute", async () => {
        await snarkjs.zKey.bellmanContribute(curve, bellman_1, bellman_2, "pa_Entropy2");
    });

    it ("zkey import bellman", async () => {
        await snarkjs.zKey.importBellman(zkey_1, bellman_2, zkey_2, "C2");
    });

    it ("zkey beacon", async () => {
        await snarkjs.zKey.beacon(zkey_2, zkey_final, "B3", "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20", 10);
    });

    it ("zkey verify", async () => {
        const res = await snarkjs.zKey.verify(path.join("test", "circuit", "circuit.r1cs"), ptau_final, zkey_final);
        assert(res);
    });

    it ("zkey export verificationkey", async () => {
        vKey = await snarkjs.zKey.exportVerificationKey(zkey_final);
    });

    it ("witness calculate", async () => {
        await snarkjs.wtns.calculate({a: 11, b:2}, path.join("test", "circuit", "circuit.wasm"), wtns);
    });

    it ("groth16 proof", async () => {
        const res = await snarkjs.groth16.prove(zkey_final, wtns);
        proof = res.proof;
        publicSignals = res.publicSignals;
    });

    it ("groth16 verify", async () => {
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        assert(res == true);
    });

});
