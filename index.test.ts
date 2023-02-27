import { PluginEvent, PluginMeta } from "@posthog/plugin-scaffold";
import { ParamsToPropertiesPlugin, PluginConfig, processEvent, setupPlugin } from "./index";

/**
 * Given a url, construct a page view event.
 *
 * @param $current_url The current url of the page view
 * @returns A new PostHog page view event
 */
function buildPageViewEvent($current_url: string): PluginEvent {
    const event: PluginEvent = {
        properties: { $current_url },
        distinct_id: "distinct_id",
        ip: "1.2.3.4",
        site_url: "posthog.com",
        team_id: 0,
        now: "2022-06-17T20:21:31.778000+00:00",
        event: "$pageview",
        uuid: "01817354-06bb-0000-d31c-2c4eed374100",
    };

    return event;
}

const defaultConfig: PluginConfig = {
    whiteList: "myUrlParameter",
    prefix: "",
    suffix: "",
    setAsUserProperties: 'false',
    setAsInitialUserProperties: 'false',
    ignoreCase: 'false'
}

const pluginJSON = require('./plugin.json')

function buildMockMeta(partialConfig: Partial<PluginConfig> = {}): PluginMeta<ParamsToPropertiesPlugin> {
    const config: PluginConfig = { ...defaultConfig, ...partialConfig }
    return {
        global: {
            ignoreCase: config.ignoreCase === "true",
            setAsInitialUserProperties: config.setAsInitialUserProperties === "true",
            setAsUserProperties: config.setAsUserProperties === "true",
            whiteList: new Set(config.whiteList ? config.whiteList.split(",").map((parameter) => parameter.trim()) : null)
        },
        config: config
    } as PluginMeta<ParamsToPropertiesPlugin>
}

describe("ParamsToPropertiesPlugin", () => {
    let mockMeta: PluginMeta<ParamsToPropertiesPlugin>

    beforeEach(() => {
        jest.clearAllMocks()

        mockMeta = buildMockMeta()
    })

    describe("setupPlugin", () => {
        it("should set one item to whitelist", () => {
            const meta = {
                global: {
                    whiteList: new Set()
                },
                config: {
                    whiteList: "one_item",
                    prefix: "",
                    suffix: "",
                    setAsUserProperties: 'false',
                    setAsInitialUserProperties: 'false',
                    ignoreCase: 'false'
                }
            } as PluginMeta<ParamsToPropertiesPlugin>

            expect(meta.global.whiteList.size).toBe(0)

            setupPlugin(meta)

            expect(meta.global.whiteList.size).toBe(1)
        })

        it("should set three item to whitelist", () => {
            const meta = {
                global: {
                    whiteList: new Set()
                },
                config: {
                    whiteList: "one_item, two_item,three_item",
                    prefix: "",
                    suffix: "",
                    setAsUserProperties: 'false',
                    setAsInitialUserProperties: 'false',
                    ignoreCase: 'false'
                }
            } as PluginMeta<ParamsToPropertiesPlugin>

            expect(meta.global.whiteList.size).toBe(0)

            setupPlugin(meta)

            expect(meta.global.whiteList.size).toBe(3)
            expect(meta.global.whiteList.has("one_item")).toBeTruthy()
            expect(meta.global.whiteList.has("two_item")).toBeTruthy()
            expect(meta.global.whiteList.has("three_item")).toBeTruthy()
        })

        it("should clear global whitelist when config is missing whitelist", () => {
            const meta = {
                global: {
                    whiteList: new Set(["one_item"])
                },
                config: {
                    prefix: "",
                    suffix: "",
                    setAsUserProperties: 'false',
                    setAsInitialUserProperties: 'false',
                    ignoreCase: 'false'
                }
            } as PluginMeta<ParamsToPropertiesPlugin>

            expect(meta.global.whiteList.size).toBe(1)

            setupPlugin(meta)

            expect(meta.global.whiteList.size).toBe(0)
        })
    })

    describe("plugin.json", () => {
        it("should contain all properties of PluginConfig", () => {
            expect(pluginJSON.config).toBeDefined()
            if (pluginJSON.config) {
                const fields = new Set<string>()
                for (const item of pluginJSON.config) {
                    fields.add(item.key)
                }
                
                expect(fields.has("ignoreCase")).toBeTruthy()
                expect(fields.has("prefix")).toBeTruthy()
                expect(fields.has("setAsInitialUserProperties")).toBeTruthy()
                expect(fields.has("setAsUserProperties")).toBeTruthy()
                expect(fields.has("suffix")).toBeTruthy()
                expect(fields.has("whiteList")).toBeTruthy()
                expect(fields.size).toEqual(6)
            }
        })

        it("should match types of all properties of PluginConfig", () => {
            expect(pluginJSON.config).toBeDefined()
            if (pluginJSON.config) {
                const fields = new Map<string, string>()
                for (const item of pluginJSON.config) {
                    fields.set(item.key, item.type)
                }
                
                expect(fields.get("ignoreCase")).toEqual("choice")
                expect(fields.get("prefix")).toEqual("string")
                expect(fields.get("setAsInitialUserProperties")).toEqual("choice")
                expect(fields.get("setAsUserProperties")).toEqual("choice")
                expect(fields.get("suffix")).toEqual("string")
                expect(fields.get("whiteList")).toEqual("string")
            }
        })
    })

    describe("processEvent", () => {

        it("shouldn't change properties count", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1");
            if (sourceEvent.properties) {
                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, mockMeta)

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount)
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, mockMeta)

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 2 property", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ whiteList: "plugin, myUrlParameter" }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 2)
                    expect(processedEvent.properties["plugin"]).toBeDefined()
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property and 1 $set property", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()
                expect(sourceEvent.properties["$set"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ setAsUserProperties: 'true' }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 2)
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                    expect(processedEvent.properties["$set"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property and 1 $set_once property", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()
                expect(sourceEvent.properties["$set_once"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ setAsInitialUserProperties: 'true' }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 2)
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                    expect(processedEvent.properties["$set_once"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property, 1 $set property and 1 $set_once property", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()
                expect(sourceEvent.properties["$set"]).not.toBeDefined()
                expect(sourceEvent.properties["$set_once"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ setAsUserProperties: 'true', setAsInitialUserProperties: 'true' }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 3)
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                    expect(processedEvent.properties["$set"]).toBeDefined()
                    expect(processedEvent.properties["$set_once"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property with prefix", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["prefix_myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ prefix: "prefix_" }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["prefix_myUrlParameter"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property with suffix", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter_suffix"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ suffix: "_suffix" }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["myUrlParameter_suffix"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property with prefix and suffix", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["prefix_myUrlParameter_suffix"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ prefix: "prefix_", suffix: "_suffix" }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["prefix_myUrlParameter_suffix"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("shouldn't add properties when $current_url is undefined", () => {
            const sourceEvent = {
                ...buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1"),
                ...{ properties: { $current_url: undefined } }
            }

            if (sourceEvent.properties) {
                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, mockMeta)

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount)
                    expect(processedEvent.properties["myUrlParameter"]).not.toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("shouldn't add properties when properties is undefined", () => {
            const sourceEvent = {
                ...buildPageViewEvent("https://posthog.com/test?plugin=1&myUrlParameter=1"),
                ...{ properties: undefined }
            }

            expect(sourceEvent.properties).not.toBeDefined()

            const processedEvent = processEvent(sourceEvent, mockMeta)
            expect(processedEvent.properties).not.toBeDefined()

        })

        it("should add 1 property regardless of case", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&MyUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ ignoreCase: 'true' }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["myUrlParameter"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("shouldn't add properties respecting case missmatch", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&MyUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta())

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount)
                    expect(processedEvent.properties["myUrlParameter"]).not.toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })

        it("should add 1 property regardless of case with prefix and suffix", () => {
            const sourceEvent = buildPageViewEvent("https://posthog.com/test?plugin=1&MyUrlParameter=1");

            if (sourceEvent.properties) {
                expect(sourceEvent.properties["myUrlParameter"]).not.toBeDefined()

                const sourcePropertiesCount = Object.keys(sourceEvent?.properties).length
                const processedEvent = processEvent(sourceEvent, buildMockMeta({ ignoreCase: 'true', prefix: "prefix_", suffix: "_suffix" }))

                if (processedEvent.properties) {
                    expect(Object.keys(processedEvent.properties).length).toBeGreaterThan(sourcePropertiesCount)
                    expect(Object.keys(processedEvent.properties).length).toEqual(sourcePropertiesCount + 1)
                    expect(processedEvent.properties["prefix_myUrlParameter_suffix"]).toBeDefined()
                }
                else {
                    expect(processedEvent.properties).toBeDefined()
                }
            }
            else {
                expect(sourceEvent.properties).toBeDefined()
            }
        })
    })
})
