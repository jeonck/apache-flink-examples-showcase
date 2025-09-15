import { useState, useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'

const flinkExamples = [
  {
    id: 'word-count',
    title: 'Word Count (기본 예제)',
    description: 'Apache Flink의 가장 기본적인 예제인 Word Count 구현',
    tags: ['Batch', 'Beginner', 'DataSet API'],
    code: `package com.example.flink;

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.util.Collector;

public class WordCount {
    public static void main(String[] args) throws Exception {
        // 실행 환경 설정
        final ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();

        // 입력 데이터 읽기
        DataSet<String> text = env.fromElements(
            "Apache Flink is a framework and distributed processing engine",
            "for stateful computations over unbounded and bounded data streams"
        );

        // 단어 분리 및 카운팅
        DataSet<Tuple2<String, Integer>> counts = text
            .flatMap(new TokenizerFunction())
            .groupBy(0)
            .sum(1);

        // 결과 출력
        counts.print();
    }

    public static final class TokenizerFunction
            implements FlatMapFunction<String, Tuple2<String, Integer>> {
        @Override
        public void flatMap(String value, Collector<Tuple2<String, Integer>> out) {
            // 소문자로 변환 후 단어 분리
            String[] words = value.toLowerCase().split("\\\\W+");
            for (String word : words) {
                if (word.length() > 0) {
                    out.collect(new Tuple2<>(word, 1));
                }
            }
        }
    }
}`,
    output: `(apache,1)
(flink,1)
(is,1)
(a,1)
(framework,1)
(and,1)
(distributed,1)
(processing,1)
(engine,1)
(for,1)
(stateful,1)
(computations,1)
(over,1)
(unbounded,1)
(bounded,1)
(data,1)
(streams,1)`
  },
  {
    id: 'csv-to-json',
    title: 'CSV to JSON 변환',
    description: 'CSV 파일을 읽어서 JSON 형태로 변환하는 예제',
    tags: ['Batch', 'DataStream API', 'File Processing'],
    code: `package com.example.flink;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.node.ObjectNode;

public class CsvToJsonConverter {
    public static void main(String[] args) throws Exception {
        final ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();

        // CSV 파일 읽기
        DataSet<String> csvData = env.readTextFile("input/users.csv");

        // CSV를 JSON으로 변환
        DataSet<String> jsonData = csvData
            .filter(line -> !line.startsWith("id,name,age,city")) // 헤더 제외
            .map(new CsvToJsonMapper());

        // JSON 파일로 저장
        jsonData.writeAsText("output/users.json");

        env.execute("CSV to JSON Conversion");
    }

    public static class CsvToJsonMapper implements MapFunction<String, String> {
        private transient ObjectMapper objectMapper;

        @Override
        public String map(String csvLine) throws Exception {
            if (objectMapper == null) {
                objectMapper = new ObjectMapper();
            }

            // CSV 라인 파싱
            String[] fields = csvLine.split(",");

            // JSON 객체 생성
            ObjectNode jsonNode = objectMapper.createObjectNode();
            jsonNode.put("id", Integer.parseInt(fields[0].trim()));
            jsonNode.put("name", fields[1].trim());
            jsonNode.put("age", Integer.parseInt(fields[2].trim()));
            jsonNode.put("city", fields[3].trim());

            return objectMapper.writeValueAsString(jsonNode);
        }
    }
}`,
    input: `# input/users.csv
id,name,age,city
1,김철수,25,서울
2,이영희,30,부산
3,박민수,28,대구`,
    output: `{"id":1,"name":"김철수","age":25,"city":"서울"}
{"id":2,"name":"이영희","age":30,"city":"부산"}
{"id":3,"name":"박민수","age":28,"city":"대구"}`
  },
  {
    id: 'streaming-aggregation',
    title: '실시간 데이터 집계',
    description: '실시간 스트림 데이터의 윈도우 기반 집계 처리',
    tags: ['Streaming', 'Window', 'Aggregation'],
    code: `package com.example.flink;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

public class StreamingAggregation {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 소켓에서 데이터 스트림 읽기
        DataStream<String> socketStream = env
            .socketTextStream("localhost", 9999);

        // 판매 데이터 파싱 및 집계
        DataStream<Tuple2<String, Double>> salesAggregation = socketStream
            .map(new SalesDataParser())
            .keyBy(value -> value.f0) // 상품별 그룹화
            .window(TumblingProcessingTimeWindows.of(Time.seconds(10))) // 10초 윈도우
            .sum(1); // 매출 합계

        // 결과 출력
        salesAggregation.print();

        env.execute("Real-time Sales Aggregation");
    }

    public static class SalesDataParser
            implements MapFunction<String, Tuple2<String, Double>> {
        @Override
        public Tuple2<String, Double> map(String value) throws Exception {
            // 형식: "product_name:price"
            String[] parts = value.split(":");
            String product = parts[0];
            Double price = Double.parseDouble(parts[1]);
            return new Tuple2<>(product, price);
        }
    }
}`,
    input: `# 소켓 입력 데이터 (localhost:9999)
Apple:1000
Banana:500
Apple:1200
Orange:800
Banana:600
Apple:900`,
    output: `# 10초 윈도우 집계 결과
(Apple,3100.0)
(Banana,1100.0)
(Orange,800.0)`
  },
  {
    id: 'json-aggregator',
    title: 'JSON 데이터 집계',
    description: 'JSON 형태의 데이터를 읽어서 다양한 집계 연산 수행',
    tags: ['JSON', 'Aggregation', 'Analytics'],
    code: `package com.example.flink;

import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.DataSet;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.JsonNode;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;

public class JsonAggregator {
    public static void main(String[] args) throws Exception {
        final ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();

        // JSON 파일 읽기
        DataSet<String> jsonLines = env.readTextFile("input/sales.json");

        // JSON 파싱 및 집계
        DataSet<Tuple3<String, Integer, Double>> aggregatedData = jsonLines
            .map(new JsonParser())
            .groupBy(0) // 카테고리별 그룹화
            .reduce(new SalesAggregator());

        // 결과 출력
        aggregatedData.print();

        env.execute("JSON Data Aggregation");
    }

    public static class JsonParser
            implements MapFunction<String, Tuple3<String, Integer, Double>> {
        private transient ObjectMapper objectMapper;

        @Override
        public Tuple3<String, Integer, Double> map(String jsonString) throws Exception {
            if (objectMapper == null) {
                objectMapper = new ObjectMapper();
            }

            JsonNode jsonNode = objectMapper.readTree(jsonString);
            String category = jsonNode.get("category").asText();
            Integer quantity = jsonNode.get("quantity").asInt();
            Double amount = jsonNode.get("amount").asDouble();

            return new Tuple3<>(category, quantity, amount);
        }
    }

    public static class SalesAggregator
            implements ReduceFunction<Tuple3<String, Integer, Double>> {
        @Override
        public Tuple3<String, Integer, Double> reduce(
                Tuple3<String, Integer, Double> value1,
                Tuple3<String, Integer, Double> value2) throws Exception {
            return new Tuple3<>(
                value1.f0, // 카테고리
                value1.f1 + value2.f1, // 수량 합계
                value1.f2 + value2.f2  // 금액 합계
            );
        }
    }
}`,
    input: `# input/sales.json
{"category":"Electronics","quantity":2,"amount":1500.00}
{"category":"Books","quantity":5,"amount":250.00}
{"category":"Electronics","quantity":1,"amount":800.00}
{"category":"Clothing","quantity":3,"amount":450.00}
{"category":"Books","quantity":2,"amount":180.00}`,
    output: `(Electronics,3,2300.0)
(Books,7,430.0)
(Clothing,3,450.0)`
  },
  {
    id: 'kafka-connector',
    title: 'Kafka 연동 스트리밍',
    description: 'Apache Kafka와 연동하여 실시간 데이터 처리',
    tags: ['Kafka', 'Streaming', 'Connector'],
    code: `package com.example.flink;

import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;
import org.apache.flink.api.common.functions.MapFunction;

import java.util.Properties;

public class KafkaStreamProcessor {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // Kafka Consumer 설정
        Properties consumerProps = new Properties();
        consumerProps.setProperty("bootstrap.servers", "localhost:9092");
        consumerProps.setProperty("group.id", "flink-consumer-group");

        // Kafka에서 데이터 스트림 생성
        FlinkKafkaConsumer<String> kafkaConsumer = new FlinkKafkaConsumer<>(
            "input-topic",
            new SimpleStringSchema(),
            consumerProps
        );

        DataStream<String> kafkaStream = env.addSource(kafkaConsumer);

        // 데이터 변환 처리
        DataStream<String> processedStream = kafkaStream
            .map(new DataProcessor())
            .filter(data -> data != null && !data.isEmpty());

        // Kafka Producer 설정
        Properties producerProps = new Properties();
        producerProps.setProperty("bootstrap.servers", "localhost:9092");

        FlinkKafkaProducer<String> kafkaProducer = new FlinkKafkaProducer<>(
            "output-topic",
            new SimpleStringSchema(),
            producerProps
        );

        // 처리된 데이터를 Kafka로 전송
        processedStream.addSink(kafkaProducer);

        env.execute("Kafka Stream Processing");
    }

    public static class DataProcessor implements MapFunction<String, String> {
        @Override
        public String map(String value) throws Exception {
            // 데이터 변환 로직
            return value.toUpperCase().trim();
        }
    }
}`,
    config: `# Kafka 설정 (application.properties)
bootstrap.servers=localhost:9092
group.id=flink-consumer-group
auto.offset.reset=earliest
enable.auto.commit=true`,
    output: `# 처리 흐름
Input Topic → Flink Processing → Output Topic
원본 데이터 → 대문자 변환 → 변환된 데이터`
  },
  {
    id: 'watermark-example',
    title: 'Watermark와 이벤트 시간',
    description: '이벤트 시간 기반 처리와 Watermark 설정',
    tags: ['Event Time', 'Watermark', 'Late Data'],
    code: `package com.example.flink;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

import java.time.Duration;
import java.time.Instant;

public class WatermarkExample {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 이벤트 시간 특성 설정
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);

        // 데이터 스트림 생성
        DataStream<String> inputStream = env.socketTextStream("localhost", 9999);

        // 타임스탬프 추출 및 Watermark 생성
        DataStream<Tuple2<String, Long>> timestampedStream = inputStream
            .map(new TimestampExtractor())
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<Tuple2<String, Long>>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                    .withTimestampAssigner((event, timestamp) -> event.f1)
            );

        // 이벤트 시간 윈도우 처리
        DataStream<Tuple2<String, Integer>> windowedCounts = timestampedStream
            .keyBy(value -> value.f0)
            .window(TumblingEventTimeWindows.of(Time.minutes(1)))
            .sum(1);

        windowedCounts.print();

        env.execute("Watermark and Event Time Example");
    }

    public static class TimestampExtractor
            implements MapFunction<String, Tuple2<String, Long>> {
        @Override
        public Tuple2<String, Long> map(String value) throws Exception {
            // 형식: "event_type,timestamp"
            String[] parts = value.split(",");
            String eventType = parts[0];
            Long timestamp = Long.parseLong(parts[1]);

            return new Tuple2<>(eventType, timestamp);
        }
    }
}`,
    input: `# 소켓 입력 (event_type,timestamp)
click,1634567890000
view,1634567895000
click,1634567900000
purchase,1634567910000
view,1634567920000`,
    output: `# 1분 윈도우별 이벤트 카운트
(click,2)
(view,2)
(purchase,1)`
  },
  {
    id: 'cep-example',
    title: 'Complex Event Processing (CEP)',
    description: '복잡한 이벤트 패턴 탐지 및 처리',
    tags: ['CEP', 'Pattern Detection', 'Event Processing'],
    code: `package com.example.flink;

import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternSelectFunction;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.pattern.Pattern;
import org.apache.flink.cep.pattern.conditions.SimpleCondition;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;

import java.util.List;
import java.util.Map;

public class CEPExample {

    public static class LoginEvent {
        public String userId;
        public String action;
        public long timestamp;

        public LoginEvent(String userId, String action, long timestamp) {
            this.userId = userId;
            this.action = action;
            this.timestamp = timestamp;
        }
    }

    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 로그인 이벤트 스트림 생성
        DataStream<LoginEvent> loginEvents = env
            .fromElements(
                new LoginEvent("user1", "login_failed", 1L),
                new LoginEvent("user1", "login_failed", 2L),
                new LoginEvent("user1", "login_failed", 3L),
                new LoginEvent("user2", "login_success", 4L)
            );

        // 패턴 정의: 3번 연속 로그인 실패
        Pattern<LoginEvent, ?> suspiciousLoginPattern = Pattern
            .<LoginEvent>begin("first")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return "login_failed".equals(event.action);
                }
            })
            .next("second")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return "login_failed".equals(event.action);
                }
            })
            .next("third")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return "login_failed".equals(event.action);
                }
            })
            .within(Time.minutes(5));

        // 패턴 매칭
        PatternStream<LoginEvent> patternStream = CEP.pattern(
            loginEvents.keyBy(event -> event.userId),
            suspiciousLoginPattern
        );

        // 패턴 매칭 결과 처리
        DataStream<String> alerts = patternStream.select(
            new PatternSelectFunction<LoginEvent, String>() {
                @Override
                public String select(Map<String, List<LoginEvent>> pattern) {
                    LoginEvent first = pattern.get("first").get(0);
                    return "ALERT: Suspicious login activity for user: " + first.userId;
                }
            }
        );

        alerts.print();

        env.execute("Complex Event Processing Example");
    }
}`,
    output: `ALERT: Suspicious login activity for user: user1`
  },
  {
    id: 'state-management',
    title: '상태 관리 (State Management)',
    description: 'Flink의 상태 관리 기능을 활용한 데이터 처리',
    tags: ['State', 'Checkpointing', 'Fault Tolerance'],
    code: `package com.example.flink;

import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class StateManagementExample {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 체크포인팅 활성화
        env.enableCheckpointing(1000);

        // 입력 스트림 생성
        DataStream<Tuple2<String, Integer>> inputStream = env
            .fromElements(
                new Tuple2<>("user1", 10),
                new Tuple2<>("user2", 20),
                new Tuple2<>("user1", 15),
                new Tuple2<>("user2", 25),
                new Tuple2<>("user1", 5)
            );

        // 상태를 사용한 누적 계산
        DataStream<Tuple2<String, Integer>> result = inputStream
            .keyBy(value -> value.f0)
            .map(new StatefulMapper());

        result.print();

        env.execute("State Management Example");
    }

    public static class StatefulMapper
            extends RichMapFunction<Tuple2<String, Integer>, Tuple2<String, Integer>> {

        private transient ValueState<Integer> sumState;

        @Override
        public void open(Configuration parameters) throws Exception {
            // 상태 디스크립터 생성
            ValueStateDescriptor<Integer> descriptor = new ValueStateDescriptor<>(
                "sum",
                TypeInformation.of(new TypeHint<Integer>() {}),
                0 // 기본값
            );
            sumState = getRuntimeContext().getState(descriptor);
        }

        @Override
        public Tuple2<String, Integer> map(Tuple2<String, Integer> input) throws Exception {
            // 현재 상태 값 가져오기
            Integer currentSum = sumState.value();

            // 새로운 값 추가
            Integer newSum = currentSum + input.f1;

            // 상태 업데이트
            sumState.update(newSum);

            return new Tuple2<>(input.f0, newSum);
        }
    }
}`,
    output: `(user1,10)
(user2,20)
(user1,25)
(user2,45)
(user1,30)`
  }
];

function CodeBlock({ title, code, language = 'java', input, output, config }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <div className="mb-6">
      <div className="code-header">
        <span className="text-white font-medium">{title}</span>
        <button
          onClick={copyToClipboard}
          className="copy-button"
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <div className="code-block">
        <pre>
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
      {input && (
        <>
          <div className="code-header mt-4">
            <span className="text-white font-medium">입력 예시</span>
          </div>
          <div className="code-block">
            <pre>
              <code className="language-bash">{input}</code>
            </pre>
          </div>
        </>
      )}
      {config && (
        <>
          <div className="code-header mt-4">
            <span className="text-white font-medium">설정</span>
          </div>
          <div className="code-block">
            <pre>
              <code className="language-properties">{config}</code>
            </pre>
          </div>
        </>
      )}
      {output && (
        <>
          <div className="code-header mt-4">
            <span className="text-white font-medium">출력 결과</span>
          </div>
          <div className="code-block">
            <pre>
              <code className="language-bash">{output}</code>
            </pre>
          </div>
        </>
      )}
    </div>
  );
}

function ExampleCard({ example }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="example-card p-6 mb-6">
      <div className="example-title">{example.title}</div>
      <div className="example-description">{example.description}</div>

      <div className="mb-4">
        {example.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>

      <button
        onClick={() => setShowCode(!showCode)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
      >
        {showCode ? '코드 숨기기' : '코드 보기'}
      </button>

      {showCode && (
        <div className="mt-6">
          <CodeBlock
            title={example.title}
            code={example.code}
            input={example.input}
            output={example.output}
            config={example.config}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', 'Batch', 'Streaming', 'JSON', 'Kafka', 'CEP', 'State'];

  const filteredExamples = flinkExamples.filter(example => {
    const matchesCategory = selectedCategory === 'all' ||
      example.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesSearch = example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Apache Flink 예제 모음
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            다양한 Apache Flink 사용 사례와 실전 예제들을 확인하세요
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <input
              type="text"
              placeholder="예제 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {category === 'all' ? '전체' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Examples Grid */}
        <div className="max-w-4xl mx-auto">
          {filteredExamples.length === 0 ? (
            <div className="text-center text-white text-xl">
              검색 조건에 맞는 예제가 없습니다.
            </div>
          ) : (
            filteredExamples.map(example => (
              <ExampleCard key={example.id} example={example} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>Apache Flink를 활용한 데이터 처리 예제들</p>
          <p className="mt-2">📚 더 많은 예제와 문서는
            <a
              href="https://flink.apache.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              공식 문서
            </a>에서 확인하세요
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;