FROM golang:1.12.5-alpine as builder
ENV GO111MODULE on
WORKDIR /go/src/app
COPY . .
RUN GOARCH=amd64 GOOS=linux CGO_ENABLED=0 go build -ldflags '-extldflags "-static" -w -s' -o app.exe main.go
FROM scratch
COPY --from=builder /go/src/app/app.exe /app.exe
EXPOSE 8080
ENTRYPOINT ["/app.exe"]
