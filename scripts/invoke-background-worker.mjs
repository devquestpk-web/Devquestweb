const response = await fetch("https://www.devquestpk.com/api/internal/process-background", {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.BACKGROUND_WORKER_SECRET || ""}` },
});

console.log(JSON.stringify({ status: response.status, body: await response.json() }));
