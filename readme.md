# ROS Pulse

### Made with Love by [Planetary](https://planetary.io/)

## About

The Pulse quantifies an organization’s operating system across 35 unique attributes, helping internal and external change agents track their impact.

## Is your organization prepared for the 21st century?

The organizations we have today are unfit for the next century. Rigid hierarchies, inflexible matrix reporting structures, meeting-rich schedules, and decision-rights for only the most tenured members – these “features” prevent any real work from getting done.

We’ve been studying groups that work in a new way and as a result have a bigger impact on the world than their competitors. We’ve been using this tool for that research and for our paying clients. It’s now available for free. Find out how your organization measures up.

## Measuring Up

Administering the Responsive OS Pulse is easy. Once you create an account you'll be given a link you can distribute to your teams. Results can are analyzed in real-time and along a variety of dimensions.

Intoning the principles measured by Responsive Pulse affords an organization greater responsiveness to competition, culture, technology, and all other forms of disruption. We believe these principles – and their associated implications on ways of working – dramatically improve even the largest and most traditional institutions – for employees, for customers, and for shareholders.

## Installation

### First, add a config/local.js file that looks like:

```javascript
module.exports = {
  auth: {
    secret: 'a secret',
    adminPassword: 'an admin password'
  },
  session: {
    secret: 'another secret'
  },
  email: {
    from: 'an email address',
    accessKeyId: 'an access key id',
    secretAccessKey: 'a secret access key',
    rateLimit: a_number,
    region: 'a region'
  },
  url: {
    production: 'a url',
    staging: 'another url'
  }
};
```

### Then run an install:

1. npm install -g gulp migrate
2. npm install
3. migrate
4. gulp

## License

Copyright 2015 Undercurrent, LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.