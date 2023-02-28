import { Plugin, PluginEvent, PluginMeta } from '@posthog/plugin-scaffold'
import { URLSearchParams } from 'url'

export type PluginConfig = {
    ignoreCase: 'true' | 'false'
    prefix: string
    setAsInitialUserProperties: 'true' | 'false'
    setAsUserProperties: 'true' | 'false'
    suffix: string
    parameters: string
}

export type ParamsToPropertiesPlugin = Plugin<{
    global: {
        ignoreCase: boolean
        setAsInitialUserProperties: boolean
        setAsUserProperties: boolean
        parameters: Set<string>
    }
    config: PluginConfig
}>

function convertSearchParams(params: URLSearchParams): URLSearchParams {
    return new URLSearchParams([...params].map(([key, value]) => [key.toLowerCase(), value]) as [string, string][])
}

export const setupPlugin = (meta: PluginMeta<ParamsToPropertiesPlugin>): void => {
    const { global, config } = meta

    global.ignoreCase = config.ignoreCase === 'true'
    global.setAsInitialUserProperties = config.setAsInitialUserProperties === 'true'
    global.setAsUserProperties = config.setAsUserProperties === 'true'
    global.parameters = new Set(
        config.parameters ? config.parameters.split(',').map((parameter) => parameter.trim()) : null
    )
}

export const processEvent = (event: PluginEvent, meta: PluginMeta<ParamsToPropertiesPlugin>): PluginEvent => {
    if (event.properties?.$current_url) {
        const url = new URL(event.properties.$current_url)
        const params = meta.global.ignoreCase
            ? convertSearchParams(new URLSearchParams(url.searchParams))
            : new URLSearchParams(url.searchParams)

        for (const name of meta.global.parameters) {
            const value = params.get(meta.global.ignoreCase ? name.toLowerCase() : name)
            if (value) {
                const key = `${meta.config.prefix}${name}${meta.config.suffix}`

                event.properties[key] = value
                if (meta.global.setAsUserProperties) {
                    event.properties.$set = event.properties.$set || {}
                    event.properties.$set[key] = value
                }

                if (meta.global.setAsInitialUserProperties) {
                    event.properties.$set_once = event.properties.$set_once || {}
                    event.properties.$set_once[`initial_${key}`] = value
                }
            }
        }
    }

    return event
}
