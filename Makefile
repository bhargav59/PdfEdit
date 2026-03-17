.PHONY: up down build logs test clean

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test:
	docker compose run --rm worker pytest /app/tests -v

clean:
	docker compose down -v --rmi local
