# URL parameters to event properties

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A PostHog app to convert specific url search/query parameters to event properties allowing you to more easily compare them in insights.

By default, this converts no parameter at all. By white listing parameters the app will look for those and convert to properties

Support [PostHog](https://posthog.com/) and give it a try today.

## Developing Locally

To develop this app locally, you'll need to clone it and then run specs. Please make sure you've got Node and Yarn installed. Pull requests welcome!

```
git clone https://github.com/PostHog/posthog-app-url-parameter-to-event-properties
yarn install
yarn test --watch
```

From there, edit away and enjoy!

## Installation

1. Open PostHog.
1. Go to the Plugins page from the sidebar.
1. Head to the Advanced tab.
1. "Install from GitHub, GitLab or npm" using this repository's URL.

## Roadmap

This app is early stage, but please consider starting a discussion or leaving an issue if there are features you'd like to see added.

## Contributing

Contributions of code, issues, reviews and documentation are welcome!

## Acknoledgements

Thanks to the awesome @posthog community!

Thanks to @everald for the initial app!
