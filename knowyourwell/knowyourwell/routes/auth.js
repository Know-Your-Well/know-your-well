/**
 * auth.js
 * 
 * This module provides routes for handling authentication using SAML (Security Assertion Markup Language).
 */

const express = require("express");

function createAuthRouter() {
  const router = express.Router();

  router.get("/idp/metadata", (req, res) => {
    res.header("Content-Type", "text/xml").send(req.idp.getMetadata());
  });

  router.get("/sso/redirect", async (req, res) => {
    const id = `_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const issueInstant = new Date().toISOString();
    const result = await req.sp.createLoginRequest(req.idp, "redirect", (template) => ({
      id,
      context: template.context.replace("{ID}", id).replace("{IssueInstant}", issueInstant),
    }));
    return res.status(200).send(result.context);
  });

  router.post("/saml/acs", async (req, res, next) => {
    try {
      const parsed = await req.sp.parseLoginResponse(req.idp, "post", req);
      req.session.kywmem = parsed.extract.attributes.kywmem;
      req.session.displayName = parsed.extract.attributes.displayName;
      return res.redirect("/Well");
    } catch (error) { return next(error); }
  });

  return router;
}

module.exports = createAuthRouter;
