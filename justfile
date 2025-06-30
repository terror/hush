set dotenv-load

export EDITOR := 'nvim'

alias b := build
alias f := fmt
alias t := test

default:
  just --list

ci: build fmt-check lint test

build:
  bun run build

fmt:
  bun run format

fmt-check:
  bun run format-check

lint:
  bun run lint

test:
  bun test
