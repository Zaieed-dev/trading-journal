import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrompwfseugqdlqhqgam.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb21wd2ZzZXVncWRscWhxZ2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MTc3MjIsImV4cCI6MjA2MjI5MzcyMn0.o9tC1cXopvl927YL7yCFZfRasSfn9SS1QCB8N9zAihY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
