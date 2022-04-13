import React, { Fragment, useState } from "react";
import { create, IPFSFTTPClient } from "ipfs-http-client";
import { ethers } from "ethers";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { Keyring } from '@polkadot/keyring';

import Message from "./Message";
import Progress from "./Progress";
import config from "../config.js";
import fs from 'fs';
import path from 'path';

const crustChainEndpoint = 'wss://rpc.crust.network'; // More endpoints: https://github.com/crustio/crust-apps/blob/master/packages/apps-config/src/endpoints/production.ts#L9
const ipfsW3GW = 'https://crustipfs.xyz'; // More web3 authed gateways: https://github.com/crustio/ipfsscan/blob/main/lib/constans.ts#L29
const crustSeed = config.seed;
const api = new ApiPromise({
  provider: new WsProvider(crustChainEndpoint),
  typesBundle: typesBundleForPolkadot
});

async function addFile(ipfs, fileContent) {
    // 1. Add file to ipfs
    const cid = await ipfs.add(fileContent);

    // 2. Get file status from ipfs
    const fileStat = await ipfs.files.stat("/ipfs/" + cid.path);

    return {
        cid: cid.path,
        size: fileStat.cumulativeSize
    };
}

async function addPrepaid(fileCid,amount) {
    // 1. Construct add-prepaid tx
    const tx = api.tx.market.addPrepaid(fileCid, amount);

    // 2. Load seeds(account)
    const kr = new Keyring({ type: 'sr25519' });
    const krp = kr.addFromUri(crustSeed);

    // 3. Send transaction
    await api.isReadyOrError;
    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({events = [], status}) => {
            console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);

            if (status.isInBlock) {
                events.forEach(({event: {method, section}}) => {
                    if (method === 'ExtrinsicSuccess') {
                        console.log(`✅  Add prepaid success!`);
                        resolve(true);
                    }
                });
            } else {
                // Pass it
            }
        }).catch(e => {
            reject(e);
        })
    });
}

async function placeStorageOrder(fileCid,fileSize) {
    // 1. Construct place-storage-order tx
    const tips = 0;
    const memo = '';
    const tx = api.tx.market.placeStorageOrder(fileCid, fileSize, tips, memo);

    // 2. Load seeds(account)
    const kr = new Keyring({ type: 'sr25519' });
    const krp = kr.addFromUri(crustSeed);

    // 3. Send transaction
    await api.isReadyOrError;
    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({events = [], status}) => {
            console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);

            if (status.isInBlock) {
                events.forEach(({event: {method, section}}) => {
                    if (method === 'ExtrinsicSuccess') {
                        console.log(`✅  Place storage order success!`);
                        resolve(true);
                    }
                });
            } else {
                // Pass it
            }
        }).catch(e => {
            reject(e);
        })
    });
}

async function getOrderState(cid){
  await api.isReadyOrError;
  return await api.query.market.files(cid);
}
// const IPFS = require("ipfs-api");

// const ipfs = new IPFS({
//   host: config.ipfs_gateway.host,
//   port: config.ipfs_gateway.port,
//   protocol: config.ipfs_gateway.protocol,
// });

const FileUpload = (props) => {
  const [file, setFile] = useState("");
  const [filename, setFilename] = useState("Choose File");
  const [uploadedFile, setUploadedFile] = useState({});
  const [message, setMessage] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [disabled, setEnabled] = useState(false);
  const [receipt, setReceipt] = useState("");

  const onChange = (e) => {
    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setEnabled(true);
    setMessage(
      "We are uploading your file to IPFS please wait for your Token ID"
    );
    try {
      // let reader = new FileReader();
      // reader.readAsArrayBuffer(file);
      // reader.onloadend = async () => {
        // let buffer = Buffer(reader.result);
      const fileContent = fs.readFileSync(path.resolve(__dirname, file));
      const ipfsLocal = create({ url: 'http://localhost:5001' });

      const pair = ethers.Wallet.createRandom();
      const sig = await pair.signMessage(pair.address);
      const authHeaderRaw = `eth-${pair.address}:${sig}`;
      const authHeader = Buffer.from(authHeaderRaw).toString('base64');
        //  / await ipfs.files.add(buffer, (error, ipfsHash) => {
          // setMessage(" Token ID : " + ipfsHash[0].hash);

        const ipfsRemote = create({
          url: `${ipfsW3GW}/api/v0`,
          headers: {
            authorization: `Basic ${authHeader}`
          }
        });
          
        const rst = await addFile(ipfsRemote, fileContent); // Or use IPFS local
        console.log(rst);
        
        await placeStorageOrder(rst.cid, rst.size);
        const addedAmt = 100;
        await addPrepaid(rst.cid, addedAmt);

        const orderStatus = (await getOrderState(rst.cid)).toJSON();
        console.log('Replica count: ', orderStatus['reported_replica_count']);
        await new Promise(f => setTimeout(f, 1000));

        let cid = rst.cid;

        props.contract.methods
          .mint(props.account, cid)
          .send({ from: props.account, handleRevert: true })
          .on("transactionHash", function(hash) {
            console.log(hash);
            setReceipt("TXN Hash: " + hash);
            console.log("prop" + props.contract.options);
          })
          .on("error", function(error, receipt) {
          alert(
            "Sorry something went wrong,  the ERC721 token already exists"
          );
        });
      setFileHash(cid);
      setEnabled(false); // make upload available again
    
        //sending the buffer+ path to ipfs (remote node)
    } catch (err) {
      setMessage("sorry couldn't upload the file for you ");
      console.log(err);
      setUploadPercentage(0);
    }
  };

  return (
    <Fragment>
      {message ? <Message msg={message} /> : null}
      <form onSubmit={onSubmit}>
        <div className="custom-file mb-4">
          <input
            type="file"
            className="custom-file-input"
            id="customFile"
            onChange={onChange}
          />
          <label className="custom-file-label" htmlFor="customFile">
            {filename}
          </label>
        </div>

        <input
          type="submit"
          value="Upload"
          className="btn btn-primary btn-block mt-4"
          disabled={disabled}
        />
      </form>
      {receipt.toString() ? <Message msg={JSON.stringify(receipt)} /> : null}
    </Fragment>
  );
};

export default FileUpload;
