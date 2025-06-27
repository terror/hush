set dotenv-load

export EDITOR := 'nvim'

alias b := build
alias f := fmt

build:
  bun run build

fmt:
  prettier --write .
