import {
    ColumnBaseConfig,
    ColumnBuilderBaseConfig,
    Equal,
    MakeColumnConfig,
} from "drizzle-orm";
import {
    AnyMySqlTable,
    MySqlTimestampBuilder as DefaultBuilder,
    MySqlTimestampBuilderInitial,
    MySqlTimestampConfig,
    MySqlTimestampHKT,
    MySqlTimestampStringBuilder,
    MySqlTimestamp as DefaultMySqlTimestamp,
} from "drizzle-orm/mysql-core";

export class MySqlTimestampBuilder<
    T extends ColumnBuilderBaseConfig
> extends DefaultBuilder<T> {
    constructor(name: T["name"], config: MySqlTimestampConfig | undefined) {
        super(name, config);
    }

    build<TTableName extends string>(
        table: AnyMySqlTable<{ name: TTableName }>
    ): MySqlTimestamp<MakeColumnConfig<T, TTableName>> {
        return new MySqlTimestamp<MakeColumnConfig<T, TTableName>>(
            table,
            this.config
        );
    }
}

export class MySqlTimestamp<
    T extends ColumnBaseConfig
> extends DefaultMySqlTimestamp<T> {
    override mapFromDriverValue(value: string): Date {
        return new Date(value + " UTC");
    }

    override mapToDriverValue(value: Date): string {
        return value.toISOString();
    }
}

export function timestamp<TName extends string>(
    name: TName,
    config?: MySqlTimestampConfig<"date">
): MySqlTimestampBuilderInitial<TName>;
export function timestamp(name: string, config: MySqlTimestampConfig = {}) {
    if (config.mode === "string") {
        return new MySqlTimestampStringBuilder(name, config);
    }
    return new MySqlTimestampBuilder(name, config);
}
