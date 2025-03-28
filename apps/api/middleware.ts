import express from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const app = express();
app.use(express.json());

// Configure the JWKS client for Clerk
const jwksClient = jwksRsa({
  jwksUri: 'https://daring-humpback-49.clerk.accounts.dev/.well-known/jwks.json',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
});

// Callback to retrieve the signing key based on the token's kid
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  if (!header.kid) {
    console.error('JWT header missing kid');
    return callback(new Error('Missing kid in token header'));
  }

  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error retrieving signing key:', err);
      return callback(err, undefined);
    }
    try {
      const signingKey = key.getPublicKey();
      console.log('Successfully retrieved signing key for kid:', header.kid);
      callback(null, signingKey);
    } catch (keyError) {
      console.error('Error processing signing key:', keyError);
      callback(keyError as Error, undefined);
    }
  });
}

// Authentication middleware
export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized: Missing auth header" });
    return;
  }
  
  // Extract token from "Bearer <token>" or raw token
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      if (err.name === 'TokenExpiredError') {
        res.status(401).send("Token expired");
      } else {
        res.status(401).send("Invalid token");
      }
      return;
    }
    
    // Attach the user id from the token to the request
    req.userId = (decoded as any).sub;
    next();
  });
}