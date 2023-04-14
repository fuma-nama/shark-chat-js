import {
    ColumnBuilderBaseConfig,
    ColumnBaseConfig,
    MakeColumnConfig,
} from "drizzle-orm";
import {
    AnyMySqlTable,
    MySqlColumn,
    MySqlDateTimeBuilderHKT,
    MySqlDateTimeBuilderInitial,
    MySqlDateTimeHKT,
    MySqlDatetimeConfig,
} from "drizzle-orm/mysql-core";
import { MySqlColumnBuilder } from "drizzle-orm/mysql-core/columns/common";

class MySqlDateTimeBuilder<
    T extends ColumnBuilderBaseConfig
> extends MySqlColumnBuilder<MySqlDateTimeBuilderHKT, T, MySqlDatetimeConfig> {
    constructor(name: T["name"], config: MySqlDatetimeConfig | undefined) {
        super(name);
        this.config.fsp = config?.fsp;
    }

    build<TTableName extends string>(
        table: AnyMySqlTable<{ name: TTableName }>
    ): MySqlDateTime<MakeColumnConfig<T, TTableName>> {
        return new MySqlDateTime<MakeColumnConfig<T, TTableName>>(
            table,
            this.config
        );
    }
}

class MySqlDateTime<T extends ColumnBaseConfig> extends MySqlColumn<
    MySqlDateTimeHKT,
    T
> {
    readonly fsp: number | undefined;

    constructor(
        table: AnyMySqlTable<{ name: T["tableName"] }>,
        config: MySqlDateTimeBuilder<T>["config"]
    ) {
        super(table, config);
        this.fsp = config.fsp;
    }

    getSQLType(): string {
        const precision =
            typeof this.fsp !== "undefined" ? `(${this.fsp})` : "";
        return `datetime${precision}`;
    }

    override mapFromDriverValue(value: string): Date {
        return new Date(value + " UTC");
    }
}

export function datetimeUtc<TName extends string>(
    name: TName,
    config: MySqlDatetimeConfig = {}
): MySqlDateTimeBuilderInitial<TName> {
    return new MySqlDateTimeBuilder(name, config);
}
