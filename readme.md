# Budget AI

I started this project for my personal use. I love ynab but I found that it still didn't answer easily questions like: where does my money go every month. I have budgets, but still it is hard to predict that with my current spending trend I will make it or not at the end of the month.
Also I lacked a clear overview of the historic spending of each category.
I created this project to give a clear graphical overview of my budget and where my money goes.

I called it Budget-AI because my goal is to integrate AI budget advice. But my first focus will be on the graphical presentation. If that is very clear, less AI advice will be needed, and the advice we get will be really to the point. If you have any suggestions or idea feel free to contact me.

I didn't share the dev url yet since the financial data is not encrypted yet. When it is encrypted end to end I will share it, since I don't want anyone's data be exposed in my database. Even when I would not take advantage of it.

# Features

# Architecture

## web

Nextjs app with daisyui and tailwind.
User authenticate with nextjs-auth0. For this we use the api/defauth endpoint.
A user can then connect its ynab account. Here we use the api/auth endpoint. This one uses the next-auth library.

## api

expressjs app. All the web requests go through the api. It also has a sync endpoint to keep ynab data up to date for each user.
Data is cached in a mongodb to avoid ynab rate limits. This is not encrypted end to end yet however, and will be an important feature before this app can go live.

# most urgent features:

- end to end encryption
- integration of prediction app in main app

# how to run

- docker-comppose
