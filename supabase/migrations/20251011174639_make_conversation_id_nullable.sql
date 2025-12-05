/*
  # Make conversation_id nullable in messages
  
  1. Changes
    - Make conversation_id nullable (messages can belong to projects directly)
    - Keep foreign key but allow null values
    
  2. Reasoning
    - Messages can be part of a simple chat (project only)
    - Or part of a threaded conversation (project + conversation)
*/

-- Make conversation_id nullable
ALTER TABLE messages ALTER COLUMN conversation_id DROP NOT NULL;
