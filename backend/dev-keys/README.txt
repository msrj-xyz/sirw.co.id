Place a generated RSA keypair here for local development (optional).

Example commands to create keys (on Linux/Mac; on Windows use Git Bash / WSL):

ssh-keygen -t rsa -b 4096 -m PEM -f private.key
# remove passphrase (press enter twice)
openssl rsa -in private.key -pubout -out public.key

Then update .env or leave defaults pointing to these files.
