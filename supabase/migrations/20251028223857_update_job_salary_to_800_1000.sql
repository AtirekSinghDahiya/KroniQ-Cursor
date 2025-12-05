/*
  # Update Job Salary Ranges to $800-$1000/month

  ## Summary
  Update all job postings to have salary range of $800 - $1000/month as starting salary

  ## Changes
  - Update all existing job postings with new salary range
*/

UPDATE job_postings 
SET salary_range = '$800 - $1000/month'
WHERE salary_range IS NOT NULL;
