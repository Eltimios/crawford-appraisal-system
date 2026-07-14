const express = require('express');
const router = express.Router();
const { downloadMinutesPdf } = require('../controllers/minutesController');

// Deliberately NOT behind `authenticate` — the query-string token itself is the
// credential (short-lived, single-purpose), the same trust model as a Supabase
// Storage signed URL. This lets `<a href>` / `window.open()` downloads work
// without needing to attach an Authorization header.
router.get('/:id', downloadMinutesPdf);

module.exports = router;
