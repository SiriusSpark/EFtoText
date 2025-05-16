package com.example.myapp.service.impl;

import com.example.myapp.dto.EventGraphDataDTO;
import com.example.myapp.entity.GeneratedText;
import com.example.myapp.entity.TextStyle;
import com.example.myapp.repository.GeneratedTextRepository;
import com.example.myapp.service.DeepseekService;
import com.example.myapp.service.EventGraphService;
import com.example.myapp.service.GeneratedTextService;
import com.example.myapp.service.TextStyleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class GeneratedTextServiceImpl implements GeneratedTextService {

    @Autowired
    private GeneratedTextRepository generatedTextRepository;

    @Autowired
    private EventGraphService eventGraphService;

    @Autowired
    private TextStyleService textStyleService;

    @Autowired
    private DeepseekService deepseekService;

    @Override
    @Transactional
    public GeneratedText generateText(Long userId, Long eventGraphId, Long styleId) {
        return generateText(userId, eventGraphId, styleId, null);
    }

    @Override
    @Transactional
    public GeneratedText generateText(Long userId, Long eventGraphId, Long styleId, String customPrompt) {
        // 获取事件图数据
        EventGraphDataDTO eventGraphData = eventGraphService.getEventGraphData(eventGraphId);
        if (eventGraphData == null) {
            throw new RuntimeException("事件图不存在");
        }

        // 获取风格（如果指定了的话）
        String stylePrompt = "";
        if (styleId != null) {
            TextStyle style = textStyleService.getStyleById(styleId);
            stylePrompt = "请按照以下风格生成文本：" + style.getName() + "。" + style.getDescription();
        }

        // 构建系统提示词
        StringBuilder systemPrompt = new StringBuilder();
        systemPrompt.append("你是一个优秀的文本生成助手，擅长将事件图转化为连贯的文本叙述。");
        systemPrompt.append("下面提供的是一个事件图的数据，包含多个事件节点和它们之间的关系。");
        systemPrompt.append("请基于这些事件和关系，生成一个连贯、有逻辑的文本叙述。");

        if (!stylePrompt.isEmpty()) {
            systemPrompt.append(stylePrompt);
        }

        // 添加自定义提示词（如果提供）
        if (customPrompt != null && !customPrompt.isEmpty()) {
            systemPrompt.append("\n特别要求：").append(customPrompt);
        }

        // 构建用户消息，包含事件图数据
        StringBuilder userMessage = new StringBuilder();
        userMessage.append("事件图标题：").append(eventGraphData.getTitle()).append("\n");
        if (eventGraphData.getDescription() != null && !eventGraphData.getDescription().isEmpty()) {
            userMessage.append("事件图描述：").append(eventGraphData.getDescription()).append("\n\n");
        }

        userMessage.append("事件节点列表：\n");
        if (eventGraphData.getNodes() != null) {
            eventGraphData.getNodes().forEach(node -> {
                userMessage.append("- ID: ").append(node.getId())
                        .append(", 标题: ").append(node.getTitle())
                        .append(", 描述: ").append(node.getDescription())
                        .append(", 开始时间: ").append(node.getStartTime())
                        .append(", 结束时间: ").append(node.getEndTime())
                        .append(", 位置: ").append(node.getLocation())
                        .append("\n");
            });
        }

        userMessage.append("\n关系列表：\n");
        if (eventGraphData.getEdges() != null) {
            eventGraphData.getEdges().forEach(edge -> {
                userMessage.append("- 从 ").append(edge.getSourceId())
                        .append(" 到 ").append(edge.getTargetId())
                        .append(", 类型: ").append(edge.getType())
                        .append(", 强度: ").append(edge.getStrength())
                        .append("\n");
            });
        }

        userMessage.append("\n请基于以上事件图数据，生成一个连贯、有逻辑的文本叙述。");

        // 调用 DeepSeek API 生成文本
        String generatedContent = deepseekService.generateText(systemPrompt.toString(), userMessage.toString());

        // 创建并保存生成的文本记录
        GeneratedText generatedText = new GeneratedText();
        generatedText.setUserId(userId);
        generatedText.setEventGraphId(eventGraphId);
        generatedText.setStyleId(styleId);
        generatedText.setContent(generatedContent);
        generatedText.setCreatedAt(LocalDateTime.now());
        generatedText.setUpdatedAt(LocalDateTime.now());

        return generatedTextRepository.save(generatedText);
    }

    @Override
    public GeneratedText getTextById(Long id) {
        return generatedTextRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文本不存在，ID: " + id));
    }

    @Override
    @Transactional
    public GeneratedText updateTextContent(Long id, Long userId, String content) {
        GeneratedText text = generatedTextRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文本不存在，ID: " + id));

        if (!text.getUserId().equals(userId)) {
            throw new RuntimeException("无权修改此文本");
        }

        text.setContent(content);
        text.setUpdatedAt(LocalDateTime.now());
        return generatedTextRepository.save(text);
    }

    @Override
    @Transactional
    public void deleteText(Long id, Long userId) {
        GeneratedText text = generatedTextRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文本不存在，ID: " + id));

        if (!text.getUserId().equals(userId)) {
            throw new RuntimeException("无权删除此文本");
        }

        generatedTextRepository.deleteById(id);
    }

    @Override
    public Optional<GeneratedText> getLatestTextByEventGraphId(Long eventGraphId) {
        return generatedTextRepository.findLatestByEventGraphId(eventGraphId);
    }

    @Override
    public List<GeneratedText> getAllTextsByEventGraphId(Long eventGraphId) {
        return generatedTextRepository.findByEventGraphIdOrderByCreatedAtDesc(eventGraphId);
    }

    @Override
    public List<GeneratedText> getAllTextsByUserId(Long userId) {
        return generatedTextRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void exportText(Long id, OutputStream outputStream) {
        try {
            GeneratedText text = getTextById(id);
            outputStream.write(text.getContent().getBytes(StandardCharsets.UTF_8));
            outputStream.flush();
        } catch (IOException e) {
            throw new RuntimeException("导出文本失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportTextsByEventGraphId(Long eventGraphId, OutputStream outputStream) {
        List<GeneratedText> texts = getAllTextsByEventGraphId(eventGraphId);
        exportTextsToZip(texts, outputStream);
    }

    @Override
    public void exportAllTextsByUserId(Long userId, OutputStream outputStream) {
        List<GeneratedText> texts = getAllTextsByUserId(userId);
        exportTextsToZip(texts, outputStream);
    }

    private void exportTextsToZip(List<GeneratedText> texts, OutputStream outputStream) {
        try (ZipOutputStream zipOut = new ZipOutputStream(outputStream)) {
            for (GeneratedText text : texts) {
                // 获取事件图标题
                EventGraphDataDTO eventGraphData = eventGraphService.getEventGraphData(text.getEventGraphId());
                String eventGraphTitle = (eventGraphData != null) ? eventGraphData.getTitle() : "未知事件图";

                // 获取风格名称（如果有的话）
                String styleName = "";
                if (text.getStyleId() != null) {
                    try {
                        TextStyle style = textStyleService.getStyleById(text.getStyleId());
                        styleName = style.getName();
                    } catch (Exception e) {
                        // 如果无法获取风格，就忽略
                    }
                }

                // 构建文件名
                String fileName;
                if (!styleName.isEmpty()) {
                    fileName = String.format("%s_%s.txt", eventGraphTitle, styleName);
                } else {
                    fileName = String.format("%s.txt", eventGraphTitle);
                }

                // 处理文件名中可能含有的非法字符
                fileName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");

                ZipEntry zipEntry = new ZipEntry(fileName);
                zipOut.putNextEntry(zipEntry);

                byte[] contentBytes = text.getContent().getBytes(StandardCharsets.UTF_8);
                zipOut.write(contentBytes, 0, contentBytes.length);

                zipOut.closeEntry();
            }

            zipOut.finish();
            zipOut.flush();
        } catch (IOException e) {
            throw new RuntimeException("导出文本到ZIP失败: " + e.getMessage(), e);
        }
    }
}