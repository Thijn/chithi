---
icon: lucide/variable
---

## CLI environment variables

The CLI uses `pydantic-settings` with an environment prefix of `CHITHI_` (see `model_config = SettingsConfigDict(env_prefix="CHITHI_")`). The following environment variables map to the CLI `Settings` fields and can be used to configure runtime behaviour.

| Variable                         | Purpose                                                                     | Notes                                                        |
| :------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `CHITHI_INSTANCE_URL`            | Base URL of the instance the CLI should target                              | Optional. Include scheme (e.g. `https://chithi.dev`).        |
| `CHITHI_EXPIRE_AFTER_N_DOWNLOAD` | Maximum number of downloads before an uploaded object is expired (by count) | Integer. When set, objects expire after this many downloads. |
| `CHITHI_EXPIRE_AFTER`            | Time in seconds after which an uploaded object expires (by time)            | Integer (seconds). Use to expire objects after a duration.   |

Notes

- The variable names are derived from the `Settings` field names with the `CHITHI_` prefix because of the `env_prefix` setting.
- All three settings are optional and map to Python types `str | None` and `int | None` in the `Settings` class.

!!! Tip

    Keep secrets and sensitive configuration out of the repository (use Docker secrets, a secrets manager, or CI secret storage). Rotate credentials regularly and restrict network access where appropriate.
