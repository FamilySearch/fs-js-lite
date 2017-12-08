If you make any changes to tests and need to record one of them, you may end up
needing to record all of them again. The requests all share one recorded
oauth request and in order to record one new test you must record a fresh oauth
request with a fresh token. Once that is done, the token won't match the other
recorded requests so they all need to be re-recorded.