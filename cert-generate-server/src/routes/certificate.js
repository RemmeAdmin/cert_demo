import express from 'express';
import request from 'request';
import redis from 'redis';
import { pki } from 'node-forge';
import { promisify } from 'util';

import { createCertificateUrl, certificateUrl } from "../config";
import { fromBase64ToPem, verifySecret, getCollection } from "../functions";

const router = express.Router();
const session = redis.createClient();
const getFromSession = promisify(session.get).bind(session);

/**
 * for create certificate
 */
router.put('/', (req, res) => {
  const { csr, token, secret } = req.body;
  if(!verifySecret(secret, token)){
    res.status(400).json({ notValid: true });
    return;
  }
  request.put(createCertificateUrl, {
      body: {
        certificate: csr
      },
      json: true,
    }, async (error, response, body) => {
      if (error) {
        console.log(e);
        return;
      }
      const { certificate } = body;
      const store = await getCollection("certificates");
      console.log(secret);
      await store.insertOne({
        certificate,
        secret
      });
      res.json({
        certificate
      })
    });
});

/**
 * for revoke certificate
 */
router.delete('/', async (req, res) => {
  const { userId } = req.body;
  const certificate = await getFromSession(userId);
  console.log(certificate);
  request.delete(certificateUrl, {
      body: {
        certificate
      },
      json: true,
    })
    .on('error', function(err) {
      console.log(err);
    });

    session.del(userId);
    res.json({ success: true });
});

export default router;