# dotenv

Dotenv loads environment variables from .env into ENV (process.env).

## Installation

As early as possible in your application require dotenv and load the .env variables. 

```javascript
var dotenv = require('dotenv')();
dotenv.load();
```

## Usage

Add your application configuration to your .env file in the root of your project:

```
S3_BUCKET=YOURS3BUCKET
SECRET_KEY=YOURSECRETKEYGOESHERE
SENDGRID_USERNAME=YOURSENDGRIDUSERNAME
SENDGRID_PASSWORD=YOURSENDGRIDPASSWORDGOESHERE
```

Whenever your application loads, these variables will be available in `process.env`:

```javascript
var sendgrid_username = process.env.SENDGRID_USERNAME;
```

## Should I commit my .env file?

Try not to commit your .env file to version control. It is best to keep it local to your machine and local on any machine you deploy to. Keep production credential .envs on your production machines, and keep development .envs on your local machine.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## Running tests

```bash
npm install
npm test
```

