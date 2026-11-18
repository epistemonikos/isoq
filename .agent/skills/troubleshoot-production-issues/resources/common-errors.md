# Common Publication Errors

This document lists common errors users encounter when trying to publish projects and their solutions.

## Error: "You need at least one reference loaded in your project"

**Cause:** Project has no references uploaded.

**Solution:**

1. Go to Project → My Data → Step 1: References
2. Upload references via:
   - File upload (RIS, BibTeX, etc.), OR
   - PubMed import
3. Verify references appear in the table
4. Try publishing again

**Prevention:** Upload references before creating findings.

---

## Error: "You need at least one reference assigned to a review finding"

**Cause:** Project has references and findings, but no finding has references assigned to it.

**Solution:**

1. Go to Organization view → click on project
2. Click on a finding in the list
3. In the Worksheet, assign references to the finding
4. Save changes
5. Try publishing again

**Prevention:** Always assign references when creating findings.

---

## Error: "You need to have at least one review finding with a complete GRADE-CERQual assessment"

**Cause:** No finding has a completed CERQual explanation.

**Solution:**

1. Go to Worksheet for a finding
2. Complete all 4 Evidence Profile components:
   - Methodological Limitations
   - Coherence
   - Adequacy
   - Relevance
3. **Most important:** Complete CERQual Assessment with detailed explanation
4. Save changes
5. Try publishing again

**Prevention:** Complete the entire Evidence Profile before attempting to publish.

---

## Error: "Your request to publish has been denied because information is missing"

**Cause:** One or more required project metadata fields are empty.

**Solution:**

1. Go to Project → Project Properties tab
2. Fill in all required fields (marked in red):
   - Title of Review (min 3 characters)
   - Authors
   - Corresponding Author (min 3 characters)
   - Corresponding Author Email (valid email)
   - Review Question (min 3 characters)
   - License Type
   - Complete by Author OR List of Authors
   - If published: URL/DOI
3. Save changes
4. Try publishing again

**Prevention:** Fill all required fields when creating the project.

---

## Error: "Cannot read properties of undefined (reading 'length')"

**Cause:** Component trying to access data that doesn't exist yet.

**Solution:**

1. Refresh the page
2. If error persists, check browser console for details
3. May indicate data corruption - check if references/findings exist

**Prevention:** Ensure data is loaded before accessing it in components.

---

## Error: Fields highlighted in red but no error message

**Cause:** Frontend validation failed but error message missing.

**Solution:**

1. Check which fields are highlighted
2. Verify field meets requirements:
   - Name: min 3 characters
   - Email: valid format
   - Review Question: min 3 characters
3. Check browser console for translation key errors
4. May need to add translation keys

**Prevention:** Ensure all translation keys exist in language files.

---

## Error: "Project is locked by another user"

**Cause:** Another user is currently editing the project.

**Solution:**

1. Wait for the other user to finish editing
2. Ask the other user to close the project
3. If user is no longer editing, wait 5 minutes for lock to expire
4. Try again

**Prevention:** Coordinate with team members before editing shared projects.

---

## Error: Changes not saving / Auto-save conflict

**Cause:** Project is in read-only mode or locked.

**Solution:**

1. Check if you have write permissions
2. Check if project is locked by another user
3. Refresh the page and try again
4. If offline, wait until connection is restored

**Prevention:** Ensure you have write access before making changes.

---

## Error: "Missing translation key" or text shows as "project.field_name"

**Cause:** Translation key doesn't exist in language file.

**Solution:**

1. Add missing key to `src/lang/en.json`
2. Add same key to `src/lang/es.json`
3. Add same key to `src/lang/pt.json`
4. Rebuild and refresh

**Prevention:** Always add translations when adding new fields.

---

## Error: Extracted data not showing

**Cause:** Extracted data not created for references in finding.

**Solution:**

1. Go to Worksheet → Extracted Data section
2. Verify there's a row for each reference
3. If missing, may need to recreate finding or manually add extracted data
4. Save changes

**Prevention:** Ensure extracted data is created when adding references to findings.
