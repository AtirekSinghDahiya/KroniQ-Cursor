/*
  # Update Job Salary Ranges

  ## Summary
  Update all job postings to have salary range of $5k - $15k/month

  ## Changes
  - Update all existing job postings with new salary range
*/

UPDATE job_postings 
SET salary_range = '$5k - $15k/month'
WHERE salary_range IS NOT NULL;
